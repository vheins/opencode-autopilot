import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { resolve } from "path"

const pkg = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf-8"))

describe("Plugin manifest", () => {
  it("has correct name", () => {
    expect(pkg.name).toBe("@vheins/opencode-autopilot")
  })

  it("has version string", () => {
    expect(pkg.version).toBe("0.1.0")
  })

  it("exports ESM entry point", () => {
    expect(pkg.exports?.["."]?.import).toBe("./dist/index.js")
  })

  it("has MIT license", () => {
    expect(pkg.license).toBe("MIT")
  })
})

describe("Module exports", () => {
  it("exports autopilot plugin function", async () => {
    const mod = await import("./index.js")
    expect(mod.autopilot).toBeDefined()
    expect(typeof mod.autopilot).toBe("function")
  })

  it("exports MockProvider class", async () => {
    const mod = await import("./index.js")
    expect(mod.MockProvider).toBeDefined()
  })

  it("exports parsePlan and formatPlanForDisplay", async () => {
    const mod = await import("./index.js")
    expect(typeof mod.parsePlan).toBe("function")
    expect(typeof mod.formatPlanForDisplay).toBe("function")
  })

  it("exports parseCodeGenOutput and writeFiles", async () => {
    const mod = await import("./index.js")
    expect(typeof mod.parseCodeGenOutput).toBe("function")
    expect(typeof mod.writeFiles).toBe("function")
  })

  it("exports generateDiff and formatDiff", async () => {
    const mod = await import("./index.js")
    expect(typeof mod.generateDiff).toBe("function")
    expect(typeof mod.formatDiff).toBe("function")
  })

  it("exports GateRunner and quality gate classes", async () => {
    const mod = await import("./index.js")
    expect(mod.GateRunner).toBeDefined()
    expect(mod.TypeCheckGate).toBeDefined()
    expect(mod.LintGate).toBeDefined()
    expect(mod.TestGate).toBeDefined()
  })

  it("exports SafetyChecker", async () => {
    const mod = await import("./index.js")
    expect(mod.SafetyChecker).toBeDefined()
    expect(mod.defaultSafetyChecker).toBeDefined()
  })
})

describe("Type exports", () => {
  it("exports type providers", async () => {
    const mod = await import("./index.js")
    expect(mod.ProviderConfig).toBeUndefined() // type-only, runtime undefined
  })
})
