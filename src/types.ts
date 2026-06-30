/** FSM states for iteration engine */
export enum IterationPhase {
  Idle = "idle",
  Planning = "planning",
  AwaitingApproval = "awaiting_approval",
  Generating = "generating",
  Reviewing = "reviewing",
  Testing = "testing",
  Committing = "committing",
  Done = "done",
  Error = "error",
}

export type SessionStatus = "active" | "paused" | "completed" | "failed"

export interface Session {
  id: string
  projectPath: string
  featureDescription: string
  createdAt: string
  lastActivity: string
  status: SessionStatus
  currentPhase: IterationPhase
  iterationCount: number
  metadata?: Record<string, unknown>
}

export interface CreateSessionResult {
  session: Session
  mcpTaskCode: string
}

export interface IterationContext {
  sessionId: string
  phase: IterationPhase
  plan?: string
  generatedFiles: string[]
  testResults: TestResult[]
  lintResults: LintResult[]
  diff?: string
}

export interface TestResult {
  passed: boolean
  output: string
  coverage?: number
}

export interface LintResult {
  errors: number
  warnings: number
  output: string
}

export interface AutopilotConfig {
  maxRetries: number
  baseDelay: number
  autoCommit: boolean
  confidenceThreshold: number
  modelMapping: Record<string, string>
}
