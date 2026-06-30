import { spawn, type SpawnOptions } from "child_process"

const DEFAULT_TIMEOUT_MS = 30_000

export interface GitResult {
  success: boolean
  output: string
  error?: string
}

export interface GitStatusEntry {
  status: string // porcelain status code (e.g. "M ", "??", "A ")
  file: string   // file path relative to repo root
}

export interface GitStatusResult extends GitResult {
  files: GitStatusEntry[]
  staged: string[]
  unstaged: string[]
  untracked: string[]
}

export interface GitDiffResult extends GitResult {
  diff: string
  filesChanged: number
  insertions: number
  deletions: number
}

export interface GitCommitOptions {
  /** Author in "Name <email>" format */
  author?: string
  /** Allow empty commit (no changes) */
  allowEmpty?: boolean
}

export class Git {
  constructor(private readonly cwd?: string) {}

  /**
   * Stage files for commit.
   * Pass ["."] to stage all changes.
   */
  async add(files: string[]): Promise<GitResult> {
    return this.run(["add", ...files])
  }

  /**
   * Create a commit with the given message.
   */
  async commit(message: string, options?: GitCommitOptions): Promise<GitResult> {
    const args: string[] = ["commit", "-m", message]
    if (options?.allowEmpty) {
      args.push("--allow-empty")
    }
    if (options?.author) {
      args.push("--author", options.author)
    }
    return this.run(args)
  }

  /**
   * Get working tree status via `git status --porcelain`.
   */
  async getStatus(): Promise<GitStatusResult> {
    const { stdout, stderr, code } = await this.exec(["status", "--porcelain"])

    if (code !== 0) {
      return {
        success: false,
        output: stdout,
        error: stderr || "git status failed",
        files: [],
        staged: [],
        unstaged: [],
        untracked: [],
      }
    }

    const lines = stdout.split("\n").filter(Boolean)
    const files: GitStatusEntry[] = lines.map((line) => ({
      status: line.substring(0, 2),
      file: line.substring(3),
    }))

    const staged = files
      .filter((f) => f.status[0] !== " " && f.status[0] !== "?")
      .map((f) => f.file)

    const unstaged = files
      .filter((f) => f.status[1] !== " " && f.status[0] !== "?")
      .map((f) => f.file)

    const untracked = files
      .filter((f) => f.status === "??")
      .map((f) => f.file)

    return {
      success: true,
      output: stdout,
      files,
      staged,
      unstaged,
      untracked,
    }
  }

  /**
   * Get diff of staged changes via `git diff --cached`.
   */
  async getDiffStaged(): Promise<GitDiffResult> {
    const { stdout, stderr, code } = await this.exec(["diff", "--cached", "--shortstat"])

    if (code !== 0) {
      return {
        success: false,
        output: stdout,
        error: stderr || "git diff failed",
        diff: "",
        filesChanged: 0,
        insertions: 0,
        deletions: 0,
      }
    }

    const filesChanged = this.countStat(stdout, /(\d+) files? changed/)
    const insertions = this.countStat(stdout, /(\d+) insertions?/)
    const deletions = this.countStat(stdout, /(\d+) deletions?/)

    return {
      success: true,
      output: stdout,
      diff: stdout,
      filesChanged,
      insertions,
      deletions,
    }
  }

  // ---- private helpers ----

  /**
   * Low-level spawn wrapper that returns stdout/stderr/exitCode.
   * Follows the pattern from quality-gates.ts.
   */
  private exec(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve) => {
      const options: SpawnOptions = {
        cwd: this.cwd ?? process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      }

      const child = spawn("git", args, options)
      let stdout = ""
      let stderr = ""

      const timer = setTimeout(() => {
        child.kill()
        resolve({ stdout, stderr, code: null })
      }, DEFAULT_TIMEOUT_MS)

      child.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString()
      })

      child.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString()
      })

      child.on("close", (code) => {
        clearTimeout(timer)
        resolve({ stdout, stderr, code })
      })

      child.on("error", (err: Error) => {
        clearTimeout(timer)
        resolve({ stdout, stderr: err.message, code: null })
      })
    })
  }

  /**
   * High-level wrapper: calls exec and maps to GitResult.
   */
  private async run(args: string[]): Promise<GitResult> {
    try {
      const { stdout, stderr, code } = await this.exec(args)
      return {
        success: code === 0,
        output: stdout,
        error: stderr || undefined,
      }
    } catch (err) {
      return {
        success: false,
        output: "",
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  /**
   * Parse a count from a diff stat line.
   * Example: " 2 files changed, 5 insertions(+), 3 deletions(-)"
   */
  private countStat(output: string, pattern: RegExp): number {
    const match = output.match(pattern)
    return match ? parseInt(match[1], 10) : 0
  }
}
