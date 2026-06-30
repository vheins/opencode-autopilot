import { IterationPhase } from "./types.js"

/** Request to an AI provider */
export interface ProviderRequest {
  phase: IterationPhase
  systemPrompt: string
  userPrompt: string
  context: Record<string, any>
  maxTokens?: number
  temperature?: number
}

/** Response from an AI provider */
export interface ProviderResponse {
  content: string
  model: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  metadata?: Record<string, any>
}

/** AI provider interface */
export interface AiProvider {
  readonly name: string
  send(request: ProviderRequest): Promise<ProviderResponse>
  isAvailable(): boolean
}

/** Configuration for a provider */
export interface ProviderConfig {
  type: "anthropic" | "openai" | "opencode" | "mock"
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

/** Default prompts per iteration phase */
export const PHASE_PROMPTS: Record<IterationPhase, string> = {
  [IterationPhase.Idle]: "",
  [IterationPhase.Planning]: `You are a senior software engineer. Analyze the following feature request and create a detailed implementation plan.

Output your plan in the following structured format:

## Plan Summary
One-line summary of what needs to be done.

## Files
- path/to/file.ts: What changes are needed (modify)
- path/to/new.ts: What this new file does (create)

## Steps
1. Step description
2. Step description

## Risks
- Risk description

## Effort: S|M|L|XL`,
  [IterationPhase.AwaitingApproval]: "",
  [IterationPhase.Generating]: `You are a senior software engineer. Implement the approved plan. Write production-ready code following best practices. Return the code changes as a structured diff.`,
  [IterationPhase.Reviewing]: `You are a senior code reviewer. Review the generated code for:
1. Correctness and bugs
2. Security vulnerabilities
3. Performance issues
4. Code style and maintainability
5. Test coverage

Provide a detailed review with actionable feedback.`,
  [IterationPhase.Testing]: "",
  [IterationPhase.Committing]: "",
  [IterationPhase.Done]: "",
  [IterationPhase.Error]: "",
}

/** Provider Factory */
export class ProviderFactory {
  private providers: Map<string, AiProvider> = new Map()

  registerProvider(name: string, provider: AiProvider): void {
    this.providers.set(name, provider)
  }

  getProvider(name: string): AiProvider {
    const provider = this.providers.get(name)
    if (!provider) throw new Error(`Provider "${name}" not registered`)
    return provider
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys()).filter(name => 
      this.providers.get(name)!.isAvailable()
    )
  }

  /** Create a provider from config */
  createProvider(config: ProviderConfig): AiProvider {
    switch (config.type) {
      case "mock":
        return new MockProvider()
      case "opencode":
        return new OpencodeProvider({ model: config.model })
      case "anthropic":
      case "openai":
        console.warn(`[provider] Direct ${config.type} integration not yet implemented, falling back to mock`)
        return new MockProvider()
      default:
        return new MockProvider()
    }
  }
}

/** Mock provider for testing */
export class MockProvider implements AiProvider {
  readonly name = "mock"

  async send(request: ProviderRequest): Promise<ProviderResponse> {
    // Simulate AI latency
    await new Promise(resolve => setTimeout(resolve, 100))

    const responses: Record<string, string> = {
      [IterationPhase.Planning]: `## Plan Summary
Implement JWT authentication with token verification and middleware

## Files
- src/auth.ts: Add JWT token verification module (modify)
- src/middleware.ts: Add auth middleware for route protection (modify)
- tests/auth.test.ts: Add unit tests for auth flow (create)

## Steps
1. Implement JWT token verification in auth.ts
2. Add auth middleware to protect API routes
3. Write comprehensive unit tests

## Risks
- Token expiry edge cases need careful handling
- Rate limiting on auth endpoints may impact UX

## Effort: M`,
      [IterationPhase.Generating]: `Here are the code changes:

\`\`\`diff
+ // src/auth.ts - JWT Authentication Module
+ import jwt from 'jsonwebtoken'
...
\`\`\``,
      [IterationPhase.Reviewing]: "## Code Review\n\n### ✅ Strengths\n- Code follows project conventions\n- Error handling is comprehensive\n\n### ⚠️ Issues\n1. No input validation on token parser\n2. Missing rate limiting consideration\n3. Test coverage could be improved\n\n### Overall: Changes requested",
    }

    const content = responses[request.phase] || "No response generated for this phase."
    
    return {
      content,
      model: "mock-gpt-4",
      usage: {
        inputTokens: request.userPrompt.length / 4,
        outputTokens: content.length / 4,
      },
    }
  }

  isAvailable(): boolean {
    return true
  }
}

/** Opencode provider — delegates to opencode's built-in AI */
export class OpencodeProvider implements AiProvider {
  readonly name = "opencode"

  constructor(private options: { model?: string; client?: any } = {}) {}

  async send(request: ProviderRequest): Promise<ProviderResponse> {
    if (this.options.client?.sendMessage) {
      try {
        // Use opencode client's AI capabilities
        const response = await this.options.client.sendMessage({
          text: `${request.systemPrompt}\n\n${request.userPrompt}`,
          model: this.options.model,
        })
        return {
          content: typeof response === 'string' ? response : response.text,
          model: this.options.model || "opencode",
          usage: response.usage,
        }
      } catch (e) {
        console.warn("[opencode-provider] Falling back to mock:", e)
      }
    }
    // Fallback to mock
    const mock = new MockProvider()
    return mock.send(request)
  }

  isAvailable(): boolean {
    return true
  }
}
