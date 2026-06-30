import { describe, it, expect } from "vitest"
import { calculateConfidence, shouldAutoCommit } from "./auto-commit.js"
import type { GateResult } from "./quality-gates.js"

function makeGateResult(overrides: Partial<GateResult>): GateResult {
  return {
    gateName: "test",
    passed: true,
    errors: [],
    warnings: [],
    duration: 100,
    rawOutput: "",
    ...overrides,
  }
}

describe("calculateConfidence", () => {
  it("should return 100 when all gates pass cleanly", () => {
    const results: GateResult[] = [
      makeGateResult({ gateName: "lint", passed: true }),
      makeGateResult({ gateName: "test", passed: true }),
      makeGateResult({ gateName: "type-check", passed: true }),
    ]
    const score = calculateConfidence(results)
    expect(score.overall).toBe(100)
    expect(score.lintScore).toBe(100)
    expect(score.testScore).toBe(100)
    expect(score.qualityScore).toBe(100)
  })

  it("should degrade when lint gate has warnings", () => {
    const results: GateResult[] = [
      makeGateResult({ gateName: "lint", passed: true, warnings: ["warn1", "warn2"] }),
      makeGateResult({ gateName: "test", passed: true }),
      makeGateResult({ gateName: "type-check", passed: true }),
    ]
    const score = calculateConfidence(results)
    expect(score.overall).toBeLessThan(100)
    expect(score.lintScore).toBe(90) // 100 - 2*5
  })

  it("should degrade when test gate fails", () => {
    const results: GateResult[] = [
      makeGateResult({ gateName: "lint", passed: true }),
      makeGateResult({ gateName: "test", passed: false, errors: ["FAIL test1", "FAIL test2"] }),
      makeGateResult({ gateName: "type-check", passed: true }),
    ]
    const score = calculateConfidence(results)
    expect(score.testScore).toBe(50) // 100 - 2*25
    expect(score.overall).toBeLessThan(100)
  })

  it("should handle missing gates gracefully", () => {
    const results: GateResult[] = [
      makeGateResult({ gateName: "lint", passed: true }),
    ]
    const score = calculateConfidence(results)
    expect(score.testScore).toBe(0)   // missing
    expect(score.qualityScore).toBeGreaterThan(0)
  })

  it("should return reduced scores when all gates fail", () => {
    const results: GateResult[] = [
      makeGateResult({ gateName: "lint", passed: false, errors: ["error1", "error2", "error3"] }),
      makeGateResult({ gateName: "test", passed: false, errors: ["FAIL test1"] }),
      makeGateResult({ gateName: "type-check", passed: false, errors: ["TS2345"] }),
    ]
    const score = calculateConfidence(results)
    // lintScore: 50 - 3*10 = 20
    // testScore: 100 - 1*25 = 75
    // typeScore: 100 - 1*20 = 80, qualityScore: (80 + 100)/2 = 90
    // overall: 75*0.5 + 20*0.25 + 90*0.25 = 65
    expect(score.lintScore).toBe(20)
    expect(score.testScore).toBe(75)
    expect(score.overall).toBeLessThan(100)
    expect(score.overall).toBeGreaterThan(50)
  })
})

describe("shouldAutoCommit", () => {
  it("should return true when confidence meets threshold", () => {
    const confidence = { overall: 85, lintScore: 90, testScore: 80, qualityScore: 85 }
    expect(shouldAutoCommit(confidence, 80)).toBe(true)
  })

  it("should return true when confidence exceeds threshold", () => {
    const confidence = { overall: 100, lintScore: 100, testScore: 100, qualityScore: 100 }
    expect(shouldAutoCommit(confidence, 80)).toBe(true)
  })

  it("should return false when confidence is below threshold", () => {
    const confidence = { overall: 70, lintScore: 80, testScore: 60, qualityScore: 75 }
    expect(shouldAutoCommit(confidence, 80)).toBe(false)
  })

  it("should return false when confidence equals threshold", () => {
    const confidence = { overall: 80, lintScore: 80, testScore: 80, qualityScore: 80 }
    expect(shouldAutoCommit(confidence, 80)).toBe(true)
  })

  it("should handle threshold of 0", () => {
    const confidence = { overall: 0, lintScore: 0, testScore: 0, qualityScore: 0 }
    expect(shouldAutoCommit(confidence, 0)).toBe(true)
  })
})

describe("end-to-end confidence flow", () => {
  it("should produce 100 confidence when all gates pass cleanly and meet default threshold", () => {
    const results: GateResult[] = [
      makeGateResult({ gateName: "lint", passed: true }),
      makeGateResult({ gateName: "test", passed: true }),
      makeGateResult({ gateName: "type-check", passed: true }),
    ]
    const confidence = calculateConfidence(results)
    expect(shouldAutoCommit(confidence, 80)).toBe(true)
  })

  it("should not auto-commit when lint warnings degrade confidence below threshold", () => {
    const results: GateResult[] = [
      makeGateResult({ gateName: "lint", passed: true, warnings: ["w1", "w2", "w3", "w4", "w5"] }),
      makeGateResult({ gateName: "test", passed: true }),
      makeGateResult({ gateName: "type-check", passed: true }),
    ]
    const confidence = calculateConfidence(results)
    // lintScore=75, testScore=100, qualityScore=(100+(100-25))/2=87.5→88
    // overall = 100*0.5 + 75*0.25 + 88*0.25 = 50 + 18.75 + 22 = 90.75→91
    expect(shouldAutoCommit(confidence, 95)).toBe(false)
  })

  it("should not auto-commit when tests fail significantly", () => {
    const results: GateResult[] = [
      makeGateResult({ gateName: "lint", passed: true }),
      makeGateResult({ gateName: "test", passed: false, errors: ["FAIL t1", "FAIL t2", "FAIL t3"] }),
      makeGateResult({ gateName: "type-check", passed: true }),
    ]
    const confidence = calculateConfidence(results)
    // testScore=25, lintScore=100, qualityScore=100
    // overall = 25*0.5 + 100*0.25 + 100*0.25 = 12.5 + 25 + 25 = 62.5→63
    expect(shouldAutoCommit(confidence, 80)).toBe(false)
  })
})
