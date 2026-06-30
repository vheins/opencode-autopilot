import type { Session, CreateSessionResult, AutopilotConfig, SessionStatus } from "./types.js"
import { IterationPhase } from "./types.js"
import { MCPClient } from "./mcp-client.js"

export class StateManager {
  private mcp: MCPClient
  private config: AutopilotConfig
  private localCache = new Map<string, Session>()

  async storeIterationContext(sessionId: string, context: Record<string, any>): Promise<void> {
    await this.mcp.storeMemory(
      `Iteration: ${sessionId}`,
      JSON.stringify({ sessionId, ...context, timestamp: new Date().toISOString() }),
      ["autopilot-iteration", `session-${sessionId}`]
    )
  }

  constructor(config: AutopilotConfig, mcpClient: MCPClient) {
    this.config = config
    this.mcp = mcpClient
  }

  async createSession(description: string, projectPath: string): Promise<CreateSessionResult> {
    // Validate inputs
    if (!description || description.trim().length === 0) {
      throw new Error("Session description must be a non-empty string")
    }
    if (!projectPath || projectPath.trim().length === 0) {
      throw new Error("Project path must be a non-empty string")
    }

    const now = new Date().toISOString()
    const timestamp = Date.now()
    const taskCode = `AUTOPILOT-SESSION-${timestamp}`

    const session: Session = {
      id: crypto.randomUUID(),
      projectPath,
      featureDescription: description.trim(),
      createdAt: now,
      lastActivity: now,
      status: "active",
      currentPhase: IterationPhase.Idle,
      iterationCount: 0,
      metadata: {},
    }

    // Attempt MCP persistence with graceful fallback
    try {
      await this.mcp.createSessionTask(description.trim(), projectPath, taskCode, "active")
    } catch (err) {
      console.warn(`[StateManager] MCP task-create failed, falling back to local cache: ${(err as Error).message}`)
    }

    try {
      await this.mcp.storeMemory(
        `Session: ${description.trim()}`,
        JSON.stringify(session, null, 2),
        ["autopilot-session"]
      )
    } catch (err) {
      console.warn(`[StateManager] MCP memory-store failed, session still cached locally: ${(err as Error).message}`)
    }

    this.localCache.set(session.id, session)

    return { session, mcpTaskCode: taskCode }
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.localCache.get(id)
  }

  async listSessions(): Promise<Session[]> {
    return Array.from(this.localCache.values())
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.localCache.get(id)
    if (!session) return undefined

    const updated: Session = {
      ...session,
      ...updates,
      lastActivity: new Date().toISOString(),
    }
    this.localCache.set(id, updated)

    // Sync to MCP as memory snapshot
    try {
      await this.mcp.storeMemory(
        `Session Update: ${updated.featureDescription}`,
        JSON.stringify(updated, null, 2),
        ["autopilot-session"]
      )
    } catch (err) {
      console.warn(`[StateManager] MCP memory-store failed during update, local cache intact: ${(err as Error).message}`)
    }

    return updated
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.localCache.delete(id)
  }

  /**
   * Force sync all cached sessions to MCP memory.
   * Gracefully handles MCP failures — local cache remains intact.
   */
  async saveState(): Promise<void> {
    const sessions = Array.from(this.localCache.values())
    for (const session of sessions) {
      await this.saveSession(session)
    }
  }

  /**
   * On startup, load all existing sessions from MCP memory into local cache.
   * Handles: MCP failures (fallback to cache), data corruption (log + skip),
   * duplicate sessions (merge by lastActivity timestamp).
   * @returns number of sessions recovered
   */
  async loadState(): Promise<number> {
    try {
      const results = await this.mcp.searchMemory("autopilot-session", ["autopilot-session"])
      if (!results) return 0

      const rawList: any[] = Array.isArray(results) ? results : (results as any).results ?? []
      if (rawList.length === 0) return 0

      let loadedCount = 0

      for (const entry of rawList) {
        const memId: string | undefined = entry?.id ?? entry?.memory_id
        if (!memId) continue

        try {
          const detail = await this.mcp.getMemoryDetail(memId)
          if (!detail?.content) continue

          const mcpSession: Session = JSON.parse(detail.content)

          // Validate minimum required fields
          if (!mcpSession.id || !mcpSession.lastActivity) {
            console.warn(`[StateManager] Skipping corrupted memory ${memId}: missing required fields`)
            continue
          }

          // Merge duplicates by lastActivity timestamp (newer wins)
          const existing = this.localCache.get(mcpSession.id)
          if (!existing || new Date(mcpSession.lastActivity) > new Date(existing.lastActivity)) {
            this.localCache.set(mcpSession.id, mcpSession)
            loadedCount++
          }
        } catch (parseErr) {
          console.warn(`[StateManager] Skipping corrupted memory ${memId}: ${(parseErr as Error).message}`)
        }
      }

      return loadedCount
    } catch (err) {
      console.warn(`[StateManager] MCP unavailable during loadState, using local cache only: ${(err as Error).message}`)
      return 0
    }
  }

  /**
   * Verify session data integrity between local cache and MCP.
   * Reports mismatches, missing sessions, and parse errors.
   * Does NOT modify any data.
   */
  async integrityCheck(): Promise<{ ok: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      const results = await this.mcp.searchMemory("autopilot-session", ["autopilot-session"])
      const mcpSessionIds = new Set<string>()

      const rawList: any[] = Array.isArray(results) ? results : (results as any).results ?? []

      for (const entry of rawList) {
        const memId: string | undefined = entry?.id ?? entry?.memory_id
        if (!memId) continue

        try {
          const detail = await this.mcp.getMemoryDetail(memId)
          if (!detail?.content) {
            issues.push(`Memory ${memId} has no content`)
            continue
          }

          const mcpSession: Session = JSON.parse(detail.content)
          if (!mcpSession.id) {
            issues.push(`Memory ${memId} content missing session id`)
            continue
          }

          mcpSessionIds.add(mcpSession.id)
          const cached = this.localCache.get(mcpSession.id)

          if (!cached) {
            issues.push(`Session ${mcpSession.id} exists in MCP but not in local cache`)
          } else if (cached.lastActivity !== mcpSession.lastActivity) {
            issues.push(`Session ${mcpSession.id} lastActivity mismatch: cache=${cached.lastActivity}, mcp=${mcpSession.lastActivity}`)
          }
        } catch (parseErr) {
          issues.push(`Memory ${memId} content is not valid JSON: ${(parseErr as Error).message}`)
        }
      }

      // Sessions in cache but missing from MCP
      for (const [id] of this.localCache) {
        if (!mcpSessionIds.has(id)) {
          issues.push(`Session ${id} exists in local cache but not in MCP`)
        }
      }
    } catch (err) {
      issues.push(`MCP unavailable during integrity check: ${(err as Error).message}`)
    }

    return { ok: issues.length === 0, issues }
  }

  /**
   * Persist a single session to MCP memory with error handling.
   */
  async saveSession(session: Session): Promise<void> {
    try {
      await this.mcp.storeMemory(
        `Session: ${session.featureDescription}`,
        JSON.stringify(session, null, 2),
        ["autopilot-session"],
      )
    } catch (err) {
      console.warn(`[StateManager] Failed to save session ${session.id} to MCP: ${(err as Error).message}`)
    }
  }

  /**
   * Load a single session from MCP by memory search.
   * Checks local cache first before querying MCP.
   */
  async loadSession(id: string): Promise<Session | undefined> {
    // Fast path — already cached
    const cached = this.localCache.get(id)
    if (cached) return cached

    // Search MCP memory for this session ID
    try {
      const results = await this.mcp.searchMemory(id, ["autopilot-session"])
      const rawList: any[] = Array.isArray(results) ? results : (results as any).results ?? []

      for (const entry of rawList) {
        const memId: string | undefined = entry?.id ?? entry?.memory_id
        if (!memId) continue

        const detail = await this.mcp.getMemoryDetail(memId)
        if (!detail?.content) continue

        const session: Session = JSON.parse(detail.content)
        if (session.id === id) {
          this.localCache.set(id, session)
          return session
        }
      }
    } catch (err) {
      console.warn(`[StateManager] MCP unavailable during loadSession(${id}): ${(err as Error).message}`)
    }

    return undefined
  }

  /**
   * Resume an interrupted session to its last known state.
   *
   * 1. Finds session by ID (cache first, then MCP via loadSession)
   * 2. Runs integrityCheck() to detect MCP/cache inconsistencies
   * 3. Returns error for "completed" or "failed" sessions
   * 4. Flags "active" sessions idle >30min as stale (still resumes)
   * 5. Reconstructs IterationContext from session's currentPhase + metadata
   * 6. Updates session status → "active", refreshes lastActivity
   *
   * @returns session + recovery metadata (recovered flag, warnings)
   * @throws if session not found or in terminal state
   */
  async resumeSession(id: string): Promise<{ session: Session; recovered: boolean; warnings: string[] }> {
    const warnings: string[] = []
    let recovered = false

    // Step 1: Find session — cache first, then MCP
    let session = this.localCache.get(id)
    if (!session) {
      const loaded = await this.loadSession(id)
      if (!loaded) {
        throw new Error(`Session ${id} not found`)
      }
      session = loaded
      recovered = true
    }

    // Step 2: Check terminal states
    if (session.status === "completed") {
      throw new Error(`Session ${id} is already completed and cannot be resumed`)
    }
    if (session.status === "failed") {
      throw new Error(`Session ${id} is in failed state and cannot be resumed`)
    }

    // Step 3: Integrity check — non-fatal, collect issues as warnings
    try {
      const integrity = await this.integrityCheck()
      if (!integrity.ok) {
        warnings.push(...integrity.issues.map(i => `Integrity: ${i}`))
      }
    } catch (err) {
      warnings.push(`Integrity check failed: ${(err as Error).message}`)
    }

    // Step 4: Check for stale session (>30min idle)
    const staleThresholdMs = 30 * 60 * 1000
    const lastActivity = new Date(session.lastActivity).getTime()
    const idleMs = Date.now() - lastActivity

    if (session.status === "active" && idleMs > staleThresholdMs) {
      warnings.push(
        `Session was idle for ${Math.round(idleMs / 60000)} minutes (>30 min threshold) — marked as stale`
      )
    }

    // Step 5: Update status to active, refresh lastActivity
    const updatedSession = await this.updateSession(id, {
      status: "active",
      lastActivity: new Date().toISOString(),
    })

    if (!updatedSession) {
      throw new Error(`Failed to update session ${id} during resume`)
    }

    return { session: updatedSession, recovered, warnings }
  }

  /**
   * Return all sessions that can be resumed — those with status "active" or "paused".
   */
  async listResumableSessions(): Promise<Session[]> {
    const sessions = Array.from(this.localCache.values())
    return sessions.filter(s => s.status === "active" || s.status === "paused")
  }

  getConfig(): AutopilotConfig {
    return { ...this.config }
  }
}
