import { IterationPhase, FSM_TRANSITIONS, type FsmEvent, type FsmHistory } from "./types.js"
import type { FiniteStateMachine } from "./types.js"

export class FSM implements FiniteStateMachine {
  private _currentPhase: IterationPhase
  private history: FsmEvent[] = []

  constructor(initialPhase: IterationPhase = IterationPhase.Idle) {
    this._currentPhase = initialPhase
  }

  get currentPhase(): IterationPhase {
    return this._currentPhase
  }

  allowedTransitions(): IterationPhase[] {
    return FSM_TRANSITIONS
      .filter(t => t.from === this._currentPhase)
      .map(t => t.to)
  }

  canTransitionTo(target: IterationPhase): boolean {
    return FSM_TRANSITIONS.some(
      t => t.from === this._currentPhase && t.to === target
    )
  }

  getGuardCondition(target: IterationPhase): string | undefined {
    const transition = FSM_TRANSITIONS.find(
      t => t.from === this._currentPhase && t.to === target
    )
    return transition?.guard
  }

  transitionTo(target: IterationPhase): IterationPhase {
    if (!this.canTransitionTo(target)) {
      const event: FsmEvent = {
        timestamp: new Date().toISOString(),
        from: this._currentPhase,
        to: target,
        success: false,
        error: `Invalid transition: ${this._currentPhase} → ${target}`,
      }
      this.history.push(event)
      throw new Error(event.error!)
    }

    const from = this._currentPhase
    this._currentPhase = target

    const event: FsmEvent = {
      timestamp: new Date().toISOString(),
      from,
      to: target,
      guard: this.getGuardCondition(target),
      success: true,
    }
    this.history.push(event)
    return this._currentPhase
  }

  getHistory(): FsmEvent[] {
    return [...this.history]
  }

  getSessionHistory(sessionId: string): FsmHistory {
    return {
      sessionId,
      events: [...this.history],
      currentPhase: this._currentPhase,
    }
  }

  reset(phase: IterationPhase = IterationPhase.Idle): void {
    this._currentPhase = phase
    this.history = []
  }
}
