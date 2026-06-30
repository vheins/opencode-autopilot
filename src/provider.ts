import { IterationPhase } from "./types.js"

/** Request to an AI provider */
export interface ProviderRequest {
  phase: IterationPhase
  systemPrompt: string
  userPrompt: string
  context: Record<string, any>
  maxTokens?: number
  temperature?: number
  metadata?: Record<string, any>
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
  [IterationPhase.Generating]: `You are a senior software engineer. Implement the approved plan. Write production-ready code.

For each file, output in this exact format:

## File: path/to/file.ts
\`\`\`language
// Full file content here
\`\`\`

## File: path/to/newfile.ts
\`\`\`language
// Full file content here
\`\`\`

Follow best practices:
- Write complete, working code (no TODOs or placeholders)
- Include imports and type definitions
- Handle errors appropriately
- Add comments for complex logic
- Follow the project's existing code style`,
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

/** Mock provider for testing */
export class MockProvider implements AiProvider {
  readonly name = "mock"
  private configuredModel: string

  constructor(options?: { model?: string }) {
    this.configuredModel = options?.model ?? "mock-gpt-4"
  }

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
      [IterationPhase.Generating]: `## File: src/auth.ts
\`\`\`typescript
import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  email: string
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' })
}
\`\`\`

## File: src/middleware.ts
\`\`\`typescript
import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from './auth.js'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
\`\`\`

## File: tests/auth.test.ts
\`\`\`typescript
import { describe, it, expect } from 'vitest'
import { verifyToken, generateToken } from '../src/auth.js'

describe('Auth', () => {
  it('should verify a valid token', () => {
    const payload = { userId: '123', email: 'test@example.com' }
    const token = generateToken(payload)
    const result = verifyToken(token)
    expect(result.userId).toBe('123')
  })

  it('should throw on invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow()
  })
})
\`\`\``,
      [IterationPhase.Reviewing]: "## Code Review\n\n### ✅ Strengths\n- Code follows project conventions\n- Error handling is comprehensive\n\n### ⚠️ Issues\n1. No input validation on token parser\n2. Missing rate limiting consideration\n3. Test coverage could be improved\n\n### Overall: Changes requested",
    }

    const content = responses[request.phase] || "No response generated for this phase."
    
    return {
      content,
      model: this.configuredModel,
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
