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
  [IterationPhase.Planning]: `You are a senior software engineer. Analyze the following feature request and create a detailed implementation plan. Include:
1. Files that need to be created or modified
2. Key architectural decisions
3. Potential risks and edge cases
4. Estimated effort (S/M/L/XL)

Output your plan as structured markdown.`,
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
        return new OpencodeProvider()
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
      [IterationPhase.Planning]: `## Implementation Plan

### Files to Modify
- \`src/auth.ts\`: Add JWT token verification
- \`src/middleware.ts\`: Add auth middleware
- \`tests/auth.test.ts\`: Add unit tests

### Key Decisions
- Use RS256 signing for JWT tokens
- Store secrets in environment variables
- Implement token refresh flow

### Risks
- Token expiry edge cases need careful handling
- Rate limiting on auth endpoints may impact UX

### Effort: M`,
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

  constructor(private options: { model?: string } = {}) {}

  async send(request: ProviderRequest): Promise<ProviderResponse> {
    // This will use opencode's built-in chat API
    // For now, delegate to mock until opencode SDK integration is available
    const mock = new MockProvider()
    return mock.send(request)
  }

  isAvailable(): boolean {
    return true
  }
}
