import { describe, it, expect, vi, beforeEach } from "vitest"
import { IterationEngine } from "./engine.js"
import { StateManager } from "./state.js"
import { MCPClient } from "./mcp-client.js"
import { MockProvider } from "./provider.js"
import { IterationPhase } from "./types.js"

vi.mock("./mcp-client.js", () => ({
  MCPClient: vi.fn(() => ({
    createSessionTask: vi.fn(),
    updateSessionTask: vi.fn(),
    listSessionTasks: vi.fn(),
    storeMemory: vi.fn(),
    searchMemory: vi.fn(),
    getMemoryDetail: vi.fn(),
    getTask: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

describe("IterationEngine", () => {
  let engine: IterationEngine
  let stateManager: StateManager

  beforeEach(() => {
    stateManager = new StateManager(
      { maxRetries: 3, baseDelay: 1000, autoCommit: false, confidenceThreshold: 70, modelMapping: {} },
      new MCPClient()
    )
    engine = new IterationEngine(stateManager, new MockProvider())
  })

  it("should start iteration and auto-transition to AwaitingApproval", async () => {
    const { session } = await stateManager.createSession("test", "/test")
    const result = await engine.startIteration(session.id)
    expect(result.phase).toBe(IterationPhase.AwaitingApproval)
    expect(result.transitions).toContain(IterationPhase.Generating)
  })

  it("should produce output from planning phase", async () => {
    const { session } = await stateManager.createSession("test", "/test")
    const result = await engine.startIteration(session.id)
    expect(result.output).toBeDefined()
    expect(result.output!.length).toBeGreaterThan(0)
  })

  it("should track FSM events through auto-transition", async () => {
    const { session } = await stateManager.createSession("test", "/test")
    const result = await engine.startIteration(session.id)
    // Idle→Planning, Planning→AwaitingApproval
    expect(result.events).toHaveLength(2)
    expect(result.events[0].to).toBe(IterationPhase.Planning)
    expect(result.events[1].to).toBe(IterationPhase.AwaitingApproval)
  })

  it("should report active when iteration is running", async () => {
    const { session } = await stateManager.createSession("test", "/test")
    await engine.startIteration(session.id)
    expect(engine.isActive()).toBe(true)
  })
})
