import { describe, it, expect, vi, beforeEach } from "vitest"
import { ProviderFactory, MockProvider, OpencodeProvider, PHASE_PROMPTS } from "./provider.js"
import type { AiProvider } from "./provider.js"
import { IterationPhase } from "./types.js"

describe("PHASE_PROMPTS", () => {
  it("should have entries for all phases", () => {
    const phases = Object.values(IterationPhase)
    for (const phase of phases) {
      expect(PHASE_PROMPTS).toHaveProperty(phase)
    }
  })

  it("should have detailed prompts for Planning phase", () => {
    expect(PHASE_PROMPTS[IterationPhase.Planning]).toContain("implementation plan")
    expect(PHASE_PROMPTS[IterationPhase.Planning]).toContain("## Plan Summary")
    expect(PHASE_PROMPTS[IterationPhase.Planning]).toContain("## Files")
    expect(PHASE_PROMPTS[IterationPhase.Planning]).toContain("## Steps")
  })

  it("should have detailed prompts for Generating phase", () => {
    expect(PHASE_PROMPTS[IterationPhase.Generating]).toContain("production-ready code")
    expect(PHASE_PROMPTS[IterationPhase.Generating]).toContain("## File:")
  })

  it("should have detailed prompts for Reviewing phase", () => {
    expect(PHASE_PROMPTS[IterationPhase.Reviewing]).toContain("code reviewer")
  })

  it("should have empty prompts for non-AI phases", () => {
    expect(PHASE_PROMPTS[IterationPhase.Idle]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.AwaitingApproval]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.Testing]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.Committing]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.Done]).toBe("")
    expect(PHASE_PROMPTS[IterationPhase.Error]).toBe("")
  })
})

describe("MockProvider", () => {
  let provider: MockProvider

  beforeEach(() => {
    provider = new MockProvider()
  })

  it("should have name 'mock'", () => {
    expect(provider.name).toBe("mock")
  })

  it("should always be available", () => {
    expect(provider.isAvailable()).toBe(true)
  })

  it("should return planning content for Planning phase", async () => {
    const response = await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
      context: {},
    })
    expect(response.content).toContain("Plan Summary")
    expect(response.content).toContain("JWT authentication")
    expect(response.model).toBe("mock-gpt-4")
    expect(response.usage).toBeDefined()
    expect(response.usage!.inputTokens).toBeGreaterThan(0)
    expect(response.usage!.outputTokens).toBeGreaterThan(0)
  })

  it("should return generating content for Generating phase", async () => {
    const response = await provider.send({
      phase: IterationPhase.Generating,
      systemPrompt: "Generate code",
      userPrompt: "Feature request",
      context: {},
    })
    expect(response.content).toContain("## File:")
    expect(response.content).toContain("src/auth.ts")
    expect(response.content).toContain("src/middleware.ts")
  })

  it("should return reviewing content for Reviewing phase", async () => {
    const response = await provider.send({
      phase: IterationPhase.Reviewing,
      systemPrompt: "Review code",
      userPrompt: "Review",
      context: {},
    })
    expect(response.content).toContain("Code Review")
  })

  it("should return fallback message for unknown phases", async () => {
    const response = await provider.send({
      phase: IterationPhase.Testing,
      systemPrompt: "",
      userPrompt: "",
      context: {},
    })
    expect(response.content).toBe("No response generated for this phase.")
  })

  it("should simulate latency", async () => {
    const start = Date.now()
    await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "",
      userPrompt: "",
      context: {},
    })
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(90) // 100ms simulated, allow some variance
  })
})

describe("OpencodeProvider", () => {
  it("should have name 'opencode'", () => {
    const provider = new OpencodeProvider()
    expect(provider.name).toBe("opencode")
  })

  it("should always be available", () => {
    const provider = new OpencodeProvider()
    expect(provider.isAvailable()).toBe(true)
  })

  it("should fallback to MockProvider when no client", async () => {
    const provider = new OpencodeProvider()
    const response = await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "",
      userPrompt: "test",
      context: {},
    })
    expect(response.content).toContain("Plan Summary")
    expect(response.model).toBe("mock-gpt-4")
  })

  it("should use client.sendMessage when available", async () => {
    const mockClient = {
      sendMessage: vi.fn().mockResolvedValue("Client response content"),
    }
    const provider = new OpencodeProvider({ client: mockClient })

    const response = await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "System prompt",
      userPrompt: "User prompt",
      context: {},
    })
    expect(response.content).toBe("Client response content")
    expect(response.model).toBe("opencode")
    expect(mockClient.sendMessage).toHaveBeenCalledWith({
      text: "System prompt\n\nUser prompt",
      model: undefined,
    })
  })

  it("should use specified model with client", async () => {
    const mockClient = {
      sendMessage: vi.fn().mockResolvedValue("Response"),
    }
    const provider = new OpencodeProvider({ model: "gpt-4", client: mockClient })

    await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "",
      userPrompt: "",
      context: {},
    })
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4" }),
    )
  })

  it("should handle client.sendMessage returning object with text", async () => {
    const mockClient = {
      sendMessage: vi.fn().mockResolvedValue({ text: "Object response" }),
    }
    const provider = new OpencodeProvider({ client: mockClient })

    const response = await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "",
      userPrompt: "",
      context: {},
    })
    expect(response.content).toBe("Object response")
  })

  it("should fallback to mock when client.sendMessage throws", async () => {
    const mockClient = {
      sendMessage: vi.fn().mockRejectedValue(new Error("API error")),
    }
    const provider = new OpencodeProvider({ client: mockClient })

    const response = await provider.send({
      phase: IterationPhase.Planning,
      systemPrompt: "",
      userPrompt: "test",
      context: {},
    })
    // Falls back to MockProvider content
    expect(response.content).toContain("Plan Summary")
  })
})

describe("ProviderFactory", () => {
  let factory: ProviderFactory

  beforeEach(() => {
    factory = new ProviderFactory()
  })

  describe("createProvider", () => {
    it("should create MockProvider for mock type", () => {
      const provider = factory.createProvider({ type: "mock" })
      expect(provider).toBeInstanceOf(MockProvider)
      expect(provider.name).toBe("mock")
    })

    it("should create OpencodeProvider for opencode type", () => {
      const provider = factory.createProvider({ type: "opencode", model: "gpt-4" })
      expect(provider).toBeInstanceOf(OpencodeProvider)
      expect(provider.name).toBe("opencode")
    })

    it("should fallback to MockProvider for anthropic type", () => {
      const provider = factory.createProvider({ type: "anthropic" })
      expect(provider).toBeInstanceOf(MockProvider)
    })

    it("should fallback to MockProvider for openai type", () => {
      const provider = factory.createProvider({ type: "openai" })
      expect(provider).toBeInstanceOf(MockProvider)
    })

    it("should fallback to MockProvider for unknown type", () => {
      const provider = factory.createProvider({ type: "unknown" as any })
      expect(provider).toBeInstanceOf(MockProvider)
    })
  })

  describe("registerProvider", () => {
    it("should register a custom provider", () => {
      const customProvider: AiProvider = {
        name: "custom",
        async send() {
          return { content: "custom", model: "custom" }
        },
        isAvailable() {
          return true
        },
      }
      factory.registerProvider("custom", customProvider)
      const retrieved = factory.getProvider("custom")
      expect(retrieved).toBe(customProvider)
    })

    it("should throw for unregistered provider", () => {
      expect(() => factory.getProvider("nonexistent")).toThrow("not registered")
    })
  })

  describe("getAvailableProviders", () => {
    it("should return empty list when no providers registered", () => {
      expect(factory.getAvailableProviders()).toEqual([])
    })

    it("should only return available providers", () => {
      const availableProvider: AiProvider = {
        name: "available",
        async send() {
          return { content: "", model: "" }
        },
        isAvailable() {
          return true
        },
      }
      const unavailableProvider: AiProvider = {
        name: "unavailable",
        async send() {
          return { content: "", model: "" }
        },
        isAvailable() {
          return false
        },
      }
      factory.registerProvider("available", availableProvider)
      factory.registerProvider("unavailable", unavailableProvider)

      const available = factory.getAvailableProviders()
      expect(available).toHaveLength(1)
      expect(available[0]).toBe("available")
    })
  })
})
