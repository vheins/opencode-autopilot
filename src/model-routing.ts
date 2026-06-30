import { IterationPhase } from "./types.js"
import {
  ProviderFactory,
  type AiProvider,
  determineProviderType,
} from "./provider.js"

/** A single route mapping phase → (model, providerType) */
export interface ModelRoute {
  phase: IterationPhase
  model: string
  providerType: "anthropic" | "openai" | "opencode" | "mock"
}

/**
 * Routes iteration phases to specific AI models and providers.
 *
 * The constructor accepts a Record<string, string> whose keys are IterationPhase
 * values (e.g. "planning", "generating") and whose values are model names
 * (e.g. "claude-4-sonnet", "gpt-4o").
 *
 * Unknown/unmapped phases return the sentinel model name "default".
 */
export class ModelRouter {
  private mapping: Map<IterationPhase, string> = new Map()
  private factory: ProviderFactory | null = null

  constructor(mapping: Record<string, string>) {
    for (const [key, model] of Object.entries(mapping)) {
      const phase = this.resolvePhase(key)
      if (phase !== undefined) {
        this.mapping.set(phase, model)
      }
    }
  }

  /** Return the model name to use for the given phase. */
  getModelForPhase(phase: IterationPhase): string {
    return this.mapping.get(phase) ?? "default"
  }

  /** Return the provider-type string for the model mapped to the given phase. */
  getProviderTypeForPhase(phase: IterationPhase): string {
    return determineProviderType(this.getModelForPhase(phase))
  }

  /**
   * Register the factory and create/register one AiProvider per unique model
   * found in the mapping.  Providers are registered under their model name so
   * that {@link getProvider} can look them up.
   */
  registerProviders(factory: ProviderFactory): void {
    this.factory = factory
    const uniqueModels = new Set(this.mapping.values())

    for (const model of uniqueModels) {
      if (factory.hasProvider(model)) continue
      const providerType = determineProviderType(model)
      const provider = factory.createProvider({ type: providerType, model })
      factory.registerProvider(model, provider)
    }
  }

  /**
   * Return the AiProvider instance for the given phase.
   * Throws if {@link registerProviders} has not been called first.
   */
  getProvider(phase: IterationPhase): AiProvider {
    if (!this.factory) {
      throw new Error(
        "ModelRouter: no provider factory registered — call registerProviders first"
      )
    }
    const model = this.getModelForPhase(phase)
    return this.factory.getProvider(model)
  }

  /**
   * Safe variant – returns the provider for the phase when one is available,
   * otherwise returns `undefined` (no throw).
   */
  tryGetProvider(phase: IterationPhase): AiProvider | undefined {
    if (!this.factory) return undefined
    const model = this.getModelForPhase(phase)
    return this.factory.hasProvider(model)
      ? this.factory.getProvider(model)
      : undefined
  }

  /** List every route currently registered. */
  getAllRoutes(): ModelRoute[] {
    return Array.from(this.mapping.entries()).map(([phase, model]) => ({
      phase,
      model,
      providerType: determineProviderType(model) as ModelRoute["providerType"],
    }))
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Try to resolve a string key to an IterationPhase value.
   *
   * Accepts both the enum VALUE (lowercase, e.g. "planning") and the enum KEY
   * (PascalCase, e.g. "Planning").
   */
  private resolvePhase(key: string): IterationPhase | undefined {
    const lower = key.toLowerCase()

    // Match by value first (e.g. "planning" → IterationPhase.Planning)
    for (const phase of Object.values(IterationPhase)) {
      if (phase === lower) return phase
    }

    // Fall back to matching by key (e.g. "Planning" → IterationPhase.Planning)
    const pascal = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
    const byKey = (IterationPhase as Record<string, IterationPhase>)[pascal]
    if (byKey !== undefined) return byKey

    return undefined
  }
}
