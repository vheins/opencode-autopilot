import { FSM } from "./fsm.js"
import { IterationPhase, type FsmEvent } from "./types.js"
import { StateManager } from "./state.js"
import { type AiProvider, PHASE_PROMPTS, type ProviderRequest } from "./provider.js"
import { parsePlan, formatPlanForDisplay } from "./plan-parser.js"
import { parseCodeGenOutput, writeFiles } from "./codegen.js"
import type { DiffResult } from "./diff.js"
import { GateRunner } from "./quality-gates.js"
import { Presenter } from "./presenter.js"

export interface EngineConfig {
  maxRetries: number
  maxRejections?: number
  model?: string
}

export interface RejectionRecord {
  feedback: string
  timestamp: string
}

export interface TransitionResult {
  phase: IterationPhase
  transitions: IterationPhase[]
  output?: string
  events: FsmEvent[]
}

export class IterationEngine {
  private fsm: FSM
  private stateManager: StateManager
  private provider: AiProvider
  private config: EngineConfig
  private currentSessionId: string | null = null
  private retryCount: number = 0
  private rejectionCounts = new Map<string, { count: number; history: RejectionRecord[] }>()
  private pendingDiff: DiffResult | null = null
  private gateRunner: GateRunner

  constructor(
    stateManager: StateManager,
    provider: AiProvider,
    config: EngineConfig = { maxRetries: 3, maxRejections: 3 }
  ) {
    this.fsm = new FSM()
    this.stateManager = stateManager
    this.provider = provider
    this.config = { maxRejections: 3, ...config }
    this.gateRunner = new GateRunner()
    this.gateRunner.registerDefaultGates()
  }

  async startIteration(sessionId: string): Promise<TransitionResult> {
    const session = await this.stateManager.getSession(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)

    this.currentSessionId = sessionId
    this.retryCount = 0
    this.fsm.transitionTo(IterationPhase.Planning)

    await this.stateManager.updateSession(sessionId, {
      currentPhase: IterationPhase.Planning,
    })

    // Execute planning phase immediately
    return this.executeCurrentPhase()
  }

  async transition(
    targetPhase: IterationPhase,
    metadata?: { approved?: boolean; feedback?: string }
  ): Promise<TransitionResult> {
    if (!this.currentSessionId) throw new Error("No active iteration")

    // Handle approval/rejection guards
    if (this.fsm.currentPhase === IterationPhase.AwaitingApproval) {
      if (targetPhase === IterationPhase.Generating && this.pendingDiff) {
        // Diff rejection with feedback — regenerate code
        if (!metadata?.feedback) {
          throw new Error("Feedback required when rejecting changes")
        }

        // Enforce max rejection limit
        const rejectionData = this.rejectionCounts.get(this.currentSessionId) ?? { count: 0, history: [] }
        if (rejectionData.count >= (this.config.maxRejections ?? 3)) {
          throw new Error(
            `Max rejections (${this.config.maxRejections}) exceeded for session ${this.currentSessionId.slice(0, 8)}`
          )
        }

        const record: RejectionRecord = { feedback: metadata.feedback, timestamp: new Date().toISOString() }
        rejectionData.count++
        rejectionData.history.push(record)
        this.rejectionCounts.set(this.currentSessionId, rejectionData)

        // Persist code rejection feedback
        await this.stateManager.storeIterationContext(this.currentSessionId, {
          type: "code_rejection",
          feedback: metadata.feedback,
          rejectionCount: rejectionData.count,
          phase: IterationPhase.AwaitingApproval,
        })

        this.retryCount++
      } else if (targetPhase === IterationPhase.Generating && !metadata?.approved) {
        throw new Error("Plan must be approved before generating")
      } else if (targetPhase === IterationPhase.Planning && metadata?.feedback) {
        // Plan rejection with feedback
        const rejectionData = this.rejectionCounts.get(this.currentSessionId) ?? { count: 0, history: [] }
        if (rejectionData.count >= (this.config.maxRejections ?? 3)) {
          throw new Error(
            `Max rejections (${this.config.maxRejections}) exceeded for session ${this.currentSessionId.slice(0, 8)}`
          )
        }

        const record: RejectionRecord = { feedback: metadata.feedback, timestamp: new Date().toISOString() }
        rejectionData.count++
        rejectionData.history.push(record)
        this.rejectionCounts.set(this.currentSessionId, rejectionData)

        // Persist rejection feedback in MCP
        await this.stateManager.storeIterationContext(this.currentSessionId, {
          type: "rejection",
          feedback: metadata.feedback,
          rejectionCount: rejectionData.count,
          phase: IterationPhase.AwaitingApproval,
        })
      }

      // Clear pending diff if transitioning out of AwaitingApproval (approve or reject)
      if (this.pendingDiff && (targetPhase === IterationPhase.Reviewing || targetPhase === IterationPhase.Generating)) {
        this.pendingDiff = null
      }
    }

    // Handle test failure → regenerate
    if (targetPhase === IterationPhase.Generating && this.retryCount >= this.config.maxRetries) {
      throw new Error(`Max retries (${this.config.maxRetries}) exceeded`)
    }

    this.fsm.transitionTo(targetPhase)
    if (targetPhase === IterationPhase.Generating && metadata?.feedback) {
      this.retryCount++
    }

    await this.stateManager.updateSession(this.currentSessionId, {
      currentPhase: targetPhase,
    })

    // Execute the new phase
    return this.executeCurrentPhase()
  }

  private async executeCurrentPhase(): Promise<TransitionResult> {
    const phase = this.fsm.currentPhase
    let output: string | undefined

    // Skip phases that don't need AI execution
    if (phase === IterationPhase.AwaitingApproval ||
        phase === IterationPhase.Done ||
        phase === IterationPhase.Error) {
      return this.buildResult(phase)
    }

    // Execute AI provider call for this phase
    const prompt = PHASE_PROMPTS[phase]
    if (prompt) {
      const session = this.currentSessionId
        ? await this.stateManager.getSession(this.currentSessionId)
        : null

      // Build system prompt with accumulated rejection feedback if available
      const rejectionData = this.currentSessionId
        ? this.rejectionCounts.get(this.currentSessionId)
        : undefined

      let enhancedPrompt = prompt
      if (phase === IterationPhase.Planning && rejectionData && rejectionData.history.length > 0) {
        const feedbackSection = rejectionData.history
          .map((r, i) => `Rejection ${i + 1} (${r.timestamp}): ${r.feedback}`)
          .join("\n")
        enhancedPrompt =
          prompt +
          `\n\n## Previous Rejection Feedback\n` +
          `The following feedback was provided on previous plan iterations. Address each point in the new plan:\n\n` +
          feedbackSection
      }

      const request: ProviderRequest = {
        phase,
        systemPrompt: enhancedPrompt,
        userPrompt: session?.featureDescription || "Execute current phase",
        context: { sessionId: this.currentSessionId || "" },
      }

      try {
        const response = await this.provider.send(request)
        output = response.content

        // Store the output in MCP memory
        if (this.currentSessionId) {
          await this.stateManager.storeIterationContext(this.currentSessionId, {
            phase,
            output,
            model: response.model,
            usage: response.usage,
          })
        }
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error))
        await this.handleError(err)
        return this.buildResult(IterationPhase.Error, `Provider error: ${err.message}`)
      }
    }

    // After successful provider response for Planning phase — parse, store, auto-transition
    if (phase === IterationPhase.Planning && output) {
      const parsed = parsePlan(output)
      await this.stateManager.storeIterationContext(this.currentSessionId!, {
        phase: IterationPhase.Planning,
        parsedPlan: parsed,
        formattedPlan: formatPlanForDisplay(parsed),
      })
      this.fsm.transitionTo(IterationPhase.AwaitingApproval)
      await this.stateManager.updateSession(this.currentSessionId!, {
        currentPhase: IterationPhase.AwaitingApproval,
      })
      return this.buildResult(IterationPhase.AwaitingApproval, output)
    }

    // Testing phase — run quality gates
    if (phase === IterationPhase.Testing) {
      const testSession = this.currentSessionId
        ? await this.stateManager.getSession(this.currentSessionId)
        : null

      const projectDir = testSession?.projectPath || "."
      const gateResult = await this.gateRunner.runAll(projectDir)

      // Store gate results in MCP memory
      const presenter = new Presenter({ colors: false, compact: true })
      const formattedOutput = presenter.presentGateResults(gateResult.results, gateResult.allPassed)

      if (this.currentSessionId) {
        await this.stateManager.storeIterationContext(this.currentSessionId, {
          phase: IterationPhase.Testing,
          gateResults: gateResult.results,
          allPassed: gateResult.allPassed,
          summary: gateResult.summary,
          formattedOutput,
        })
      }

      if (gateResult.allPassed) {
        this.fsm.transitionTo(IterationPhase.Committing)
        await this.stateManager.updateSession(this.currentSessionId!, {
          currentPhase: IterationPhase.Committing,
        })
        return this.buildResult(IterationPhase.Committing, formattedOutput)
      } else {
        // Tests failed — regenerate code
        this.retryCount++
        this.fsm.transitionTo(IterationPhase.Generating)
        await this.stateManager.updateSession(this.currentSessionId!, {
          currentPhase: IterationPhase.Generating,
        })
        return this.buildResult(IterationPhase.Generating, formattedOutput)
      }
    }

    // After successful provider response for Generating phase — parse codegen output and write files
    if (phase === IterationPhase.Generating && output) {
      const parsed = parseCodeGenOutput(output)

      // Get session for project path (session from prompt block above is not in scope)
      const genSession = this.currentSessionId
        ? await this.stateManager.getSession(this.currentSessionId)
        : null

      // Write generated files to disk with backup and diff capture
      const writeResult = await writeFiles(
        parsed.files,
        genSession?.projectPath || ".",
        { dryRun: false, createBackup: true },
      )

      await this.stateManager.storeIterationContext(this.currentSessionId!, {
        phase: IterationPhase.Generating,
        codeGenResult: parsed,
        fileCount: parsed.files.length,
        writeResult,
      })

      // Store diff for user review and transition to AwaitingApproval
      if (writeResult.diff) {
        this.pendingDiff = writeResult.diff
      }

      this.fsm.transitionTo(IterationPhase.AwaitingApproval)
      await this.stateManager.updateSession(this.currentSessionId!, {
        currentPhase: IterationPhase.AwaitingApproval,
      })
      return this.buildResult(IterationPhase.AwaitingApproval, output)
    }

    return this.buildResult(phase, output)
  }

  private buildResult(phase: IterationPhase, output?: string): TransitionResult {
    return {
      phase,
      transitions: this.fsm.allowedTransitions(),
      output,
      events: this.fsm.getHistory(),
    }
  }

  async handleError(error: Error): Promise<void> {
    console.error(`[engine] Error in session ${this.currentSessionId}:`, error.message)
    try {
      this.fsm.transitionTo(IterationPhase.Error)
      if (this.currentSessionId) {
        await this.stateManager.updateSession(this.currentSessionId, {
          currentPhase: IterationPhase.Error,
        })
      }
    } catch {
      // Already in error state
    }
  }

  async resume(sessionId: string, phase: IterationPhase): Promise<TransitionResult> {
    this.currentSessionId = sessionId
    this.fsm.reset(phase)
    this.pendingDiff = null
    return this.buildResult(phase)
  }

  getState() {
    return {
      sessionId: this.currentSessionId,
      phase: this.fsm.currentPhase,
      transitions: this.fsm.allowedTransitions(),
      history: this.fsm.getHistory(),
      retryCount: this.retryCount,
      hasPendingDiff: this.pendingDiff !== null,
    }
  }

  isActive(): boolean {
    return this.currentSessionId !== null &&
      this.fsm.currentPhase !== IterationPhase.Done &&
      this.fsm.currentPhase !== IterationPhase.Error
  }

  /** Get the pending diff for user review, if any */
  getPendingDiff(): DiffResult | null {
    return this.pendingDiff
  }
}
