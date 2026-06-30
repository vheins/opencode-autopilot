import { describe, it, expect, beforeEach } from "vitest"
import { ModelRouter, type ModelRoute } from "./model-routing.js"
import {
  ProviderFactory,
  MockProvider,
  OpencodeProvider,
  determineProviderType,
} from "./provider.js"
import { IterationPhase } from "./types.js"

describe("determineProviderType", () => {
  it("should detect anthropic models", () => {
    expect(determineProviderType("claude-4-sonnet")).toBe("anthropic")
    expect(determineProviderType("claude-3-opus")).toBe("anthropic")
    expect(determineProviderType("CLAUDE-sonnet")).toBe("anthropic")
  })

  it("should detect openai models", () => {
    expect(determineProviderType("gpt-4o")).toBe("openai")
    expect(determineProviderType("gpt-4-turbo")).toBe("openai")
    expect(determineProviderType("o1-preview")).toBe("openai")
    expect(determineProviderType("o3-mini")).toBe("openai")
    expect(determineProviderType("GPT-4")).toBe("openai")
  })

  it("should detect opencode models", () => {
    expect(determineProviderType("opencode-default")).toBe("opencode")
    expect(determineProviderType("opencode")).toBe("opencode")
  })

  it("should return mock for unknown models", () => {
    expect(determineProviderType("unknown-model")).toBe("mock")
    expect(determineProviderType("llama-3")).toBe("mock")
    expect(determineProviderType("")).toBe("mock")
  })
})

describe("ModelRouter", () => {
  describe("constructor", () => {
    it("should parse mapping with lowercase phase values", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
        generating: "gpt-4o",
      })
      const routes = router.getAllRoutes()
      expect(routes).toHaveLength(2)

      const planningRoute = routes.find(
        (r) => r.phase === IterationPhase.Planning,
      )
      expect(planningRoute).toBeDefined()
      expect(planningRoute!.model).toBe("claude-4-sonnet")
      expect(planningRoute!.providerType).toBe("anthropic")

      const generatingRoute = routes.find(
        (r) => r.phase === IterationPhase.Generating,
      )
      expect(generatingRoute).toBeDefined()
      expect(generatingRoute!.model).toBe("gpt-4o")
      expect(generatingRoute!.providerType).toBe("openai")
    })

    it("should parse mapping with PascalCase keys", () => {
      const router = new ModelRouter({
        Planning: "claude-4-sonnet",
        Generating: "gpt-4o",
      })
      expect(router.getModelForPhase(IterationPhase.Planning)).toBe(
        "claude-4-sonnet",
      )
      expect(router.getModelForPhase(IterationPhase.Generating)).toBe("gpt-4o")
    })

    it("should handle empty mapping", () => {
      const router = new ModelRouter({})
      expect(router.getAllRoutes()).toHaveLength(0)
    })

    it("should skip invalid phase keys", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
        nonexistent_phase: "gpt-4o",
      })
      const routes = router.getAllRoutes()
      expect(routes).toHaveLength(1)
      expect(routes[0].phase).toBe(IterationPhase.Planning)
    })
  })

  describe("getModelForPhase", () => {
    it("should return correct model per phase", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
        generating: "gpt-4o",
        reviewing: "claude-4-sonnet",
      })
      expect(router.getModelForPhase(IterationPhase.Planning)).toBe(
        "claude-4-sonnet",
      )
      expect(router.getModelForPhase(IterationPhase.Generating)).toBe("gpt-4o")
      expect(router.getModelForPhase(IterationPhase.Reviewing)).toBe(
        "claude-4-sonnet",
      )
    })

    it("should return 'default' for unmapped phases", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
      })
      expect(router.getModelForPhase(IterationPhase.Testing)).toBe("default")
      expect(router.getModelForPhase(IterationPhase.Committing)).toBe("default")
      expect(router.getModelForPhase(IterationPhase.Idle)).toBe("default")
    })
  })

  describe("getProviderTypeForPhase", () => {
    it("should return correct provider type per phase", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
        generating: "gpt-4o",
      })
      expect(router.getProviderTypeForPhase(IterationPhase.Planning)).toBe(
        "anthropic",
      )
      expect(router.getProviderTypeForPhase(IterationPhase.Generating)).toBe(
        "openai",
      )
    })

    it("should return 'mock' for unmapped phases", () => {
      const router = new ModelRouter({})
      expect(router.getProviderTypeForPhase(IterationPhase.Planning)).toBe(
        "mock",
      )
    })
  })

  describe("getAllRoutes", () => {
    it("should list all registered routes", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
        generating: "gpt-4o",
      })
      const routes = router.getAllRoutes()
      expect(routes).toHaveLength(2)
      expect(routes).toEqual(
        expect.arrayContaining([
          {
            phase: IterationPhase.Planning,
            model: "claude-4-sonnet",
            providerType: "anthropic",
          },
          {
            phase: IterationPhase.Generating,
            model: "gpt-4o",
            providerType: "openai",
          },
        ]),
      )
    })
  })

  describe("registerProviders and getProvider", () => {
    let factory: ProviderFactory

    beforeEach(() => {
      factory = new ProviderFactory()
    })

    it("should create and register one provider per unique model", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
        generating: "gpt-4o",
        reviewing: "claude-4-sonnet", // same model as planning
      })
      router.registerProviders(factory)

      // Same model → same provider instance
      const planningProvider = router.getProvider(IterationPhase.Planning)
      const reviewingProvider = router.getProvider(IterationPhase.Reviewing)
      expect(planningProvider).toBe(reviewingProvider)

      // Different model → different provider
      const generatingProvider = router.getProvider(IterationPhase.Generating)
      expect(generatingProvider).not.toBe(planningProvider)
    })

    it("should register MockProviders for unsupported types", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
        generating: "gpt-4o",
      })
      router.registerProviders(factory)

      const planningProvider = router.getProvider(IterationPhase.Planning)
      const generatingProvider = router.getProvider(IterationPhase.Generating)

      // Both fall back to MockProvider since direct integration not implemented
      expect(planningProvider).toBeInstanceOf(MockProvider)
      expect(generatingProvider).toBeInstanceOf(MockProvider)
    })

    it("should configure MockProviders with correct model names", async () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
        generating: "gpt-4o",
      })
      router.registerProviders(factory)

      const planningProvider = router.getProvider(
        IterationPhase.Planning,
      ) as MockProvider
      const planningResponse = await planningProvider.send({
        phase: IterationPhase.Planning,
        systemPrompt: "",
        userPrompt: "test",
        context: {},
      })
      expect(planningResponse.model).toBe("claude-4-sonnet")

      const generatingProvider = router.getProvider(
        IterationPhase.Generating,
      ) as MockProvider
      const generatingResponse = await generatingProvider.send({
        phase: IterationPhase.Generating,
        systemPrompt: "",
        userPrompt: "test",
        context: {},
      })
      expect(generatingResponse.model).toBe("gpt-4o")
    })

    it("should throw when calling getProvider without registerProviders", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
      })
      expect(() => router.getProvider(IterationPhase.Planning)).toThrow(
        "no provider factory registered",
      )
    })

    it("should throw for unmapped phase when using getProvider", () => {
      const router = new ModelRouter({
        planning: "claude-4-sonnet",
      })
      router.registerProviders(factory)
      // "default" provider does not exist in factory
      expect(() => router.getProvider(IterationPhase.Testing)).toThrow(
        'Provider "default" not registered',
      )
    })
  })

  describe("tryGetProvider", () => {
    it("should return undefined when no factory registered", () => {
      const router = new ModelRouter({ planning: "claude-4-sonnet" })
      expect(router.tryGetProvider(IterationPhase.Planning)).toBeUndefined()
    })

    it("should return undefined for unmapped phases", () => {
      const router = new ModelRouter({ planning: "claude-4-sonnet" })
      router.registerProviders(new ProviderFactory())
      expect(router.tryGetProvider(IterationPhase.Testing)).toBeUndefined()
    })

    it("should return provider for mapped phases", () => {
      const localFactory = new ProviderFactory()
      const router = new ModelRouter({ planning: "claude-4-sonnet" })
      router.registerProviders(localFactory)
      expect(router.tryGetProvider(IterationPhase.Planning)).toBeDefined()
    })
  })
})
