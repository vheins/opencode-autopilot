import { FSM } from "./fsm.js"
import { IterationPhase, type FsmEvent } from "./types.js"
import { StateManager } from "./state.js"
import { type AiProvider, ProviderFactory, PHASE_PROMPTS, type ProviderRequest } from "./provider.js"

export interface EngineConfig {
  maxRetries: number
  model?: string
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

  constructor(
    stateManager: StateManager,
    provider: AiProvider,
    config: EngineConfig = { maxRetries: 3 }
  ) {
    this.fsm = new FSM()
    this.stateManager = stateManager
    this.provider = provider
    this.config = config
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
      if (targetPhase === IterationPhase.Generating && !metadata?.approved) {
        throw new Error("Plan must be approved before generating")
      }
      if (targetPhase === IterationPhase.Planning && metadata?.feedback) {
        await this.stateManager.storeIterationContext(this.currentSessionId, {
          feedback: metadata.feedback,
          phase: IterationPhase.AwaitingApproval,
        })
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

      const request: ProviderRequest = {
        phase,
        systemPrompt: prompt,
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
      } catch (error: any) {
        await this.handleError(error)
        return this.buildResult(IterationPhase.Error, `Provider error: ${error.message}`)
      }
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
    return this.buildResult(phase)
  }

  getState() {
    return {
      sessionId: this.currentSessionId,
      phase: this.fsm.currentPhase,
      transitions: this.fsm.allowedTransitions(),
      history: this.fsm.getHistory(),
      retryCount: this.retryCount,
    }
  }

  isActive(): boolean {
    return this.currentSessionId !== null &&
      this.fsm.currentPhase !== IterationPhase.Done &&
      this.fsm.currentPhase !== IterationPhase.Error
  }
}
