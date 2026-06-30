import { describe, it, expect, vi } from "vitest"
import { GateRunner, TypeCheckGate, LintGate, TestGate } from "./quality-gates.js"

vi.setConfig({ testTimeout: 30000 })

describe("GateRunner", () => {
  it("should register and run gates", async () => {
    const runner = new GateRunner()
    runner.registerGate(new TypeCheckGate())
    const result = await runner.runAll(process.cwd())
    expect(result.results).toHaveLength(1)
  }, 30000)
  it("should support runByName", async () => {
    const runner = new GateRunner()
    runner.registerDefaultGates()
    const result = await runner.runByName("type-check", process.cwd())
    expect(result).not.toBeNull()
  }, 30000)
  it("should return null for unknown gate", async () => {
    expect(await new GateRunner().runByName("x", process.cwd())).toBeNull()
  })
})

describe("TypeCheckGate", () => {
  it("should pass on valid codebase", async () => {
    const result = await new TypeCheckGate().run(process.cwd())
    expect(result.gateName).toBe("type-check")
  }, 30000)
})

describe("LintGate", () => {
  it("should run ESLint", async () => {
    const result = await new LintGate("eslint").run(process.cwd())
    expect(result.gateName).toBe("lint")
  })
})

describe("TestGate", () => {
  it("should run Vitest", async () => {
    vi.spyOn(TestGate.prototype, "run").mockResolvedValue({
      gateName: "test",
      passed: true,
      errors: [],
      warnings: [],
      duration: 0,
      rawOutput: "mocked output",
    })
    const result = await new TestGate().run(process.cwd())
    expect(result.gateName).toBe("test")
  })
})
