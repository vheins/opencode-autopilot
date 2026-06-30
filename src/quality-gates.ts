import { spawn } from "child_process"

export interface GateResult {
  gateName: string
  passed: boolean
  errors: string[]
  warnings: string[]
  duration: number
  rawOutput: string
}

export interface GateConfig {
  command: string
  args: string[]
  timeout: number
  workingDirectory?: string
}

export abstract class QualityGate {
  abstract readonly name: string
  abstract run(projectDir: string): Promise<GateResult>

  protected async execute(command: string, args: string[], cwd: string, timeout: number): Promise<GateResult> {
    const start = Date.now()
    const errors: string[] = []
    const warnings: string[] = []

    return new Promise((resolve) => {
      const child = spawn(command, args, { cwd, stdio: ["pipe", "pipe", "pipe"] })
      let stdout = ""
      let stderr = ""

      const timer = setTimeout(() => {
        child.kill()
        resolve({
          gateName: this.name,
          passed: false,
          errors: [...errors, "Timed out"],
          warnings,
          duration: Date.now() - start,
          rawOutput: stdout + stderr,
        })
      }, timeout)

      child.stdout?.on("data", (data: Buffer) => { stdout += data.toString() })
      child.stderr?.on("data", (data: Buffer) => { stderr += data.toString() })

      child.on("close", (code) => {
        clearTimeout(timer)
        const output = stdout + stderr
        resolve({
          gateName: this.name,
          passed: code === 0,
          errors: this.parseErrors(output, code),
          warnings: this.parseWarnings(output),
          duration: Date.now() - start,
          rawOutput: output,
        })
      })

      child.on("error", (err) => {
        clearTimeout(timer)
        resolve({
          gateName: this.name,
          passed: false,
          errors: [err.message],
          warnings,
          duration: Date.now() - start,
          rawOutput: stderr,
        })
      })
    })
  }

  abstract parseErrors(output: string, exitCode: number | null): string[]
  abstract parseWarnings(output: string): string[]
}

export class TypeCheckGate extends QualityGate {
  readonly name = "type-check"

  async run(projectDir: string): Promise<GateResult> {
    return this.execute("npx", ["tsc", "--noEmit"], projectDir, 60000)
  }

  parseErrors(output: string, exitCode: number | null): string[] {
    if (exitCode === 0 || exitCode === null) return []
    return output.split("\n")
      .filter(l => l.includes("error TS") || l.includes("Error:"))
      .map(l => l.trim())
  }

  parseWarnings(_output: string): string[] {
    return []
  }
}

export class LintGate extends QualityGate {
  readonly name = "lint"

  constructor(private tool: "eslint" | "biome" = "eslint") { super() }

  async run(projectDir: string): Promise<GateResult> {
    if (this.tool === "eslint") {
      return this.execute("npx", ["eslint", "src/", "--max-warnings", "0"], projectDir, 60000)
    }
    return this.execute("npx", ["@biomejs/biome", "check", "src/"], projectDir, 60000)
  }

  parseErrors(output: string, exitCode: number | null): string[] {
    if (exitCode === 0 || exitCode === null) return []
    return output.split("\n")
      .filter(l => l.includes("error") || l.includes("Error"))
      .map(l => l.trim())
      .filter(l => l.length > 0)
  }

  parseWarnings(output: string): string[] {
    return output.split("\n")
      .filter(l => l.includes("warning") && !l.includes("error"))
      .map(l => l.trim())
  }
}

export class TestGate extends QualityGate {
  readonly name = "test"

  async run(projectDir: string): Promise<GateResult> {
    return this.execute("npx", ["vitest", "run", "--reporter", "json"], projectDir, 120000)
  }

  parseErrors(output: string, exitCode: number | null): string[] {
    if (exitCode === 0 || exitCode === null) return []
    return output.split("\n")
      .filter(l => l.includes("FAIL") || l.includes("failed"))
      .map(l => l.trim())
  }

  parseWarnings(output: string): string[] {
    return output.split("\n")
      .filter(l => l.includes("passed") || l.includes("skip"))
      .map(l => l.trim())
  }
}

export class GateRunner {
  private gates: QualityGate[] = []

  registerGate(gate: QualityGate): void {
    this.gates.push(gate)
  }

  registerDefaultGates(): void {
    this.gates.push(new TypeCheckGate())
    this.gates.push(new LintGate())
    this.gates.push(new TestGate())
  }

  async runAll(projectDir: string): Promise<{
    results: GateResult[]
    allPassed: boolean
    summary: string
  }> {
    const results: GateResult[] = []
    let allPassed = true

    for (const gate of this.gates) {
      const result = await gate.run(projectDir)
      results.push(result)
      if (!result.passed) allPassed = false
    }

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const summary = `Quality Gates: ${passed} passed, ${failed} failed`

    return { results, allPassed, summary }
  }

  async runByName(name: string, projectDir: string): Promise<GateResult | null> {
    const gate = this.gates.find(g => g.name === name)
    if (!gate) return null
    return gate.run(projectDir)
  }

  clearGates(): void {
    this.gates = []
  }
}
