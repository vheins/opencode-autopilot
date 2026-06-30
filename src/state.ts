import type { Session, CreateSessionResult, AutopilotConfig, SessionStatus } from "./types.js"
import { IterationPhase } from "./types.js"
import fs from "fs"
import path from "path"

export class StateManager {
  private config: AutopilotConfig
  private projectDir: string
  private sessionsFilePath: string
  private localCache = new Map<string, Session>()

  constructor(config: AutopilotConfig, projectDir: string) {
    this.config = config
    this.projectDir = projectDir
    this.sessionsFilePath = path.join(projectDir, ".autopilot", "sessions.json")
  }

  private async ensureDir(): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.sessionsFilePath), { recursive: true })
  }

  async storeIterationContext(sessionId: string, context: Record<string, any>): Promise<void> {
    await this.ensureDir()
    const filePath = path.join(this.projectDir, ".autopilot", `context-${sessionId}.json`)
    let existing: Record<string, any> = {}
    try {
      const raw = await fs.promises.readFile(filePath, "utf-8")
      existing = JSON.parse(raw)
    } catch {
      // File doesn't exist yet, start fresh
    }
    const data = { ...existing, ...context, sessionId, timestamp: new Date().toISOString() }
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
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

    this.localCache.set(session.id, session)
    await this.saveState()

    return { session }
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
    await this.saveState()

    return updated
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = this.localCache.delete(id)
    if (result) await this.saveState()
    return result
  }

  /**
   * Persist all cached sessions to the JSON file.
   */
  async saveState(): Promise<void> {
    await this.ensureDir()
    const sessions = Array.from(this.localCache.values())
    await fs.promises.writeFile(this.sessionsFilePath, JSON.stringify(sessions, null, 2), "utf-8")
  }

  /**
   * Load sessions from the JSON file into the local cache.
   * @returns number of sessions loaded
   */
  async loadState(): Promise<number> {
    try {
      const content = await fs.promises.readFile(this.sessionsFilePath, "utf-8")
      const sessions: Session[] = JSON.parse(content)
      if (!Array.isArray(sessions)) return 0
      this.localCache.clear()
      for (const session of sessions) {
        if (session.id) {
          this.localCache.set(session.id, session)
        }
      }
      return this.localCache.size
    } catch (err: any) {
      if (err.code === "ENOENT") return 0
      console.warn(`[StateManager] Failed to load state: ${err.message}`)
      return 0
    }
  }

  /**
   * Verify session data integrity of the JSON file.
   */
  async integrityCheck(): Promise<{ ok: boolean; issues: string[] }> {
    const issues: string[] = []

    try {
      const content = await fs.promises.readFile(this.sessionsFilePath, "utf-8")
      const sessions: Session[] = JSON.parse(content)
      if (!Array.isArray(sessions)) {
        issues.push("Sessions file does not contain an array")
        return { ok: false, issues }
      }
      for (const session of sessions) {
        if (!session.id || !session.lastActivity) {
          issues.push(`Session missing required fields (id or lastActivity)`)
        }
      }
    } catch (err: any) {
      if (err.code === "ENOENT") {
        return { ok: true, issues: [] }
      }
      issues.push(`Failed to read sessions file: ${err.message}`)
    }

    return { ok: issues.length === 0, issues }
  }

  /**
   * Persist a single session to local cache and file.
   */
  async saveSession(session: Session): Promise<void> {
    this.localCache.set(session.id, session)
    await this.saveState()
  }

  /**
   * Load a single session — checks local cache first, then reloads from file.
   */
  async loadSession(id: string): Promise<Session | undefined> {
    const cached = this.localCache.get(id)
    if (cached) return cached

    await this.loadState()
    return this.localCache.get(id)
  }

  /**
   * Resume an interrupted session to its last known state.
   *
   * @returns session + recovery metadata (recovered flag, warnings)
   * @throws if session not found or in terminal state
   */
  async resumeSession(id: string): Promise<{ session: Session; recovered: boolean; warnings: string[] }> {
    const warnings: string[] = []
    let recovered = false

    // Find session — cache first, then file
    let session = this.localCache.get(id)
    if (!session) {
      const loaded = await this.loadSession(id)
      if (!loaded) {
        throw new Error(`Session ${id} not found`)
      }
      session = loaded
      recovered = true
    }

    // Check terminal states
    if (session.status === "completed") {
      throw new Error(`Session ${id} is already completed and cannot be resumed`)
    }
    if (session.status === "failed") {
      throw new Error(`Session ${id} is in failed state and cannot be resumed`)
    }

    // Check for stale session (>30min idle)
    const staleThresholdMs = 30 * 60 * 1000
    const lastActivity = new Date(session.lastActivity).getTime()
    const idleMs = Date.now() - lastActivity

    if (session.status === "active" && idleMs > staleThresholdMs) {
      warnings.push(
        `Session was idle for ${Math.round(idleMs / 60000)} minutes (>30 min threshold) — marked as stale`
      )
    }

    // Update status to active, refresh lastActivity
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
