import type { GateResult } from "./quality-gates.js"

export interface AutoCommitConfig {
  enabled: boolean
  confidenceThreshold: number
}

export interface ConfidenceScore {
  overall: number
  lintScore: number
  testScore: number
  qualityScore: number
}

/**
 * Calculate confidence score from quality gate results.
 *
 * Scoring breakdown:
 * - lintScore (0-100): 100 if passed, degrades by warning/error count
 * - testScore (0-100): 100 if passed, degrades by failure count
 * - qualityScore (0-100): Composite of type-check pass rate and warning penalty
 * - overall: Weighted average: test 50%, lint 25%, quality 25%
 */
export function calculateConfidence(gateResults: GateResult[]): ConfidenceScore {
  const lintResult = gateResults.find(r => r.gateName === "lint")
  const testResult = gateResults.find(r => r.gateName === "test")
  const typeResult = gateResults.find(r => r.gateName === "type-check")

  const lintScore = lintResult
    ? (lintResult.passed
      ? Math.max(0, 100 - (lintResult.warnings?.length ?? 0) * 5)
      : Math.max(0, 50 - (lintResult.errors?.length ?? 0) * 10))
    : 0

  const testScore = testResult
    ? (testResult.passed
      ? 100
      : Math.max(0, 100 - (testResult.errors?.length ?? 0) * 25))
    : 0

  const typeScore = typeResult
    ? (typeResult.passed ? 100 : Math.max(0, 100 - (typeResult.errors?.length ?? 0) * 20))
    : 0

  const totalWarnings = gateResults.reduce((sum, r) => sum + (r.warnings?.length ?? 0), 0)
  const warningPenalty = Math.min(totalWarnings * 5, 50)
  const qualityScore = Math.round((typeScore + (100 - warningPenalty)) / 2)

  const overall = Math.round(
    testScore * 0.5 +
    lintScore * 0.25 +
    qualityScore * 0.25
  )

  return { overall, lintScore, testScore, qualityScore }
}

/**
 * Determine whether to auto-commit based on confidence score and threshold.
 */
export function shouldAutoCommit(confidence: ConfidenceScore, threshold: number): boolean {
  return confidence.overall >= threshold
}
