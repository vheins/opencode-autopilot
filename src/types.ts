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

export interface AutoCommitConfig {
  enabled: boolean
  confidenceThreshold: number
}

export interface AutopilotConfig {
  maxRetries: number
  baseDelay: number
  autoCommit: AutoCommitConfig
  modelMapping: Record<string, string>
}

/** Type for allowed state transitions */
export type FsmTransition = {
  from: IterationPhase
  to: IterationPhase
  guard?: string  // description of guard condition
}

/** FSM configuration — defines all allowed transitions */
export const FSM_TRANSITIONS: FsmTransition[] = [
  { from: IterationPhase.Idle, to: IterationPhase.Planning },
  { from: IterationPhase.Idle, to: IterationPhase.Error },
  { from: IterationPhase.Planning, to: IterationPhase.AwaitingApproval },
  { from: IterationPhase.Planning, to: IterationPhase.Error },
  { from: IterationPhase.AwaitingApproval, to: IterationPhase.Generating, guard: "User approved plan" },
  { from: IterationPhase.AwaitingApproval, to: IterationPhase.Reviewing, guard: "User approved changes" },
  { from: IterationPhase.AwaitingApproval, to: IterationPhase.Planning, guard: "User rejected plan with feedback" },
  { from: IterationPhase.AwaitingApproval, to: IterationPhase.Idle, guard: "User cancelled" },
  { from: IterationPhase.Generating, to: IterationPhase.Reviewing },
  { from: IterationPhase.Generating, to: IterationPhase.AwaitingApproval },
  { from: IterationPhase.Generating, to: IterationPhase.Error },
  { from: IterationPhase.Reviewing, to: IterationPhase.Testing },
  { from: IterationPhase.Reviewing, to: IterationPhase.Planning, guard: "Review failed, regenerate plan" },
  { from: IterationPhase.Reviewing, to: IterationPhase.Error },
  { from: IterationPhase.Testing, to: IterationPhase.AwaitingApproval, guard: "All gates passed, confidence below threshold, awaiting approval" },
  { from: IterationPhase.Testing, to: IterationPhase.Committing },
  { from: IterationPhase.Testing, to: IterationPhase.Generating, guard: "Tests failed, regenerate code" },
  { from: IterationPhase.Testing, to: IterationPhase.Error },
  { from: IterationPhase.Committing, to: IterationPhase.Done },
  { from: IterationPhase.Committing, to: IterationPhase.Error },
  { from: IterationPhase.Error, to: IterationPhase.Idle, guard: "Error recovered" },
  { from: IterationPhase.Error, to: IterationPhase.Planning, guard: "Error during planning" },
  { from: IterationPhase.Done, to: IterationPhase.Idle },
]

/** FSM engine interface */
export interface FiniteStateMachine {
  currentPhase: IterationPhase
  allowedTransitions(): IterationPhase[]
  canTransitionTo(target: IterationPhase): boolean
  transitionTo(target: IterationPhase): IterationPhase
  getGuardCondition(target: IterationPhase): string | undefined
}

/** FSM event log entry */
export interface FsmEvent {
  timestamp: string
  from: IterationPhase
  to: IterationPhase
  guard?: string
  success: boolean
  error?: string
}

/** FSM history for a session */
export interface FsmHistory {
  sessionId: string
  events: FsmEvent[]
  currentPhase: IterationPhase
}
