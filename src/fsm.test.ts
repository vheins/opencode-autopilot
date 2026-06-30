import { describe, it, expect } from "vitest"
import { FSM } from "./fsm.js"
import { IterationPhase } from "./types.js"

describe("FSM", () => {
  describe("initialization", () => {
    it("should start in Idle phase by default", () => {
      const fsm = new FSM()
      expect(fsm.currentPhase).toBe(IterationPhase.Idle)
    })

    it("should start in specified phase", () => {
      const fsm = new FSM(IterationPhase.Planning)
      expect(fsm.currentPhase).toBe(IterationPhase.Planning)
    })
  })

  describe("allowedTransitions", () => {
    it("should return [Planning, Error] from Idle", () => {
      const fsm = new FSM()
      const transitions = fsm.allowedTransitions()
      expect(transitions).toContain(IterationPhase.Planning)
      expect(transitions).toContain(IterationPhase.Error)
      expect(transitions).not.toContain(IterationPhase.Done)
    })

    it("should return [Generating, Planning, Idle] from AwaitingApproval", () => {
      const fsm = new FSM(IterationPhase.AwaitingApproval)
      const transitions = fsm.allowedTransitions()
      expect(transitions).toContain(IterationPhase.Generating)
      expect(transitions).toContain(IterationPhase.Planning)
      expect(transitions).toContain(IterationPhase.Idle)
    })
  })

  describe("canTransitionTo", () => {
    it("should allow valid transition", () => {
      const fsm = new FSM()
      expect(fsm.canTransitionTo(IterationPhase.Planning)).toBe(true)
    })

    it("should reject invalid transition", () => {
      const fsm = new FSM()
      expect(fsm.canTransitionTo(IterationPhase.Done)).toBe(false)
    })
  })

  describe("transitionTo", () => {
    it("should execute valid transition", () => {
      const fsm = new FSM()
      fsm.transitionTo(IterationPhase.Planning)
      expect(fsm.currentPhase).toBe(IterationPhase.Planning)
    })

    it("should throw on invalid transition", () => {
      const fsm = new FSM()
      expect(() => fsm.transitionTo(IterationPhase.Done)).toThrow(/Invalid transition/)
    })

    it("should follow the full happy path: Idle→Planning→AwaitingApproval→Generating→Reviewing→Testing→Committing→Done", () => {
      const fsm = new FSM()
      fsm.transitionTo(IterationPhase.Planning)
      fsm.transitionTo(IterationPhase.AwaitingApproval)
      fsm.transitionTo(IterationPhase.Generating)
      fsm.transitionTo(IterationPhase.Reviewing)
      fsm.transitionTo(IterationPhase.Testing)
      fsm.transitionTo(IterationPhase.Committing)
      fsm.transitionTo(IterationPhase.Done)
      expect(fsm.currentPhase).toBe(IterationPhase.Done)
    })

    it("should handle error recovery: Error→Idle", () => {
      const fsm = new FSM(IterationPhase.Error)
      fsm.transitionTo(IterationPhase.Idle)
      expect(fsm.currentPhase).toBe(IterationPhase.Idle)
    })
  })

  describe("getGuardCondition", () => {
    it("should return guard for AwaitingApproval→Generating", () => {
      const fsm = new FSM(IterationPhase.AwaitingApproval)
      const guard = fsm.getGuardCondition(IterationPhase.Generating)
      expect(guard).toBe("User approved plan")
    })

    it("should return undefined for transitions without guard", () => {
      const fsm = new FSM(IterationPhase.Idle)
      const guard = fsm.getGuardCondition(IterationPhase.Planning)
      expect(guard).toBeUndefined()
    })
  })

  describe("history", () => {
    it("should track successful transitions", () => {
      const fsm = new FSM()
      fsm.transitionTo(IterationPhase.Planning)
      const history = fsm.getHistory()
      expect(history).toHaveLength(1)
      expect(history[0].from).toBe(IterationPhase.Idle)
      expect(history[0].to).toBe(IterationPhase.Planning)
      expect(history[0].success).toBe(true)
    })

    it("should track failed transition attempts", () => {
      const fsm = new FSM()
      try { fsm.transitionTo(IterationPhase.Done) } catch { /* expected */ }
      const history = fsm.getHistory()
      expect(history).toHaveLength(1)
      expect(history[0].success).toBe(false)
      expect(history[0].error).toBeDefined()
    })
  })

  describe("reset", () => {
    it("should reset to specified phase", () => {
      const fsm = new FSM(IterationPhase.Committing)
      fsm.reset(IterationPhase.Idle)
      expect(fsm.currentPhase).toBe(IterationPhase.Idle)
      expect(fsm.getHistory()).toHaveLength(0)
    })
  })

  describe("getSessionHistory", () => {
    it("should return session history with events", () => {
      const fsm = new FSM()
      fsm.transitionTo(IterationPhase.Planning)
      const sessionHistory = fsm.getSessionHistory("test-123")
      expect(sessionHistory.sessionId).toBe("test-123")
      expect(sessionHistory.events).toHaveLength(1)
      expect(sessionHistory.currentPhase).toBe(IterationPhase.Planning)
    })
  })
})
