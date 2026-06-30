import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventEmitter } from "events"
import { spawn } from "child_process"
import { Git } from "./git.js"

// Mock spawn at module level (same pattern as state.test.ts)
vi.mock("child_process", () => ({
  spawn: vi.fn(),
}))

type MockChild = EventEmitter & {
  stdout: EventEmitter
  stderr: EventEmitter
  kill: ReturnType<typeof vi.fn>
}

function createMockChild(): MockChild {
  const child = new EventEmitter() as MockChild
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  child.kill = vi.fn()
  return child
}

describe("Git", () => {
  let git: Git
  let mockChild: MockChild

  beforeEach(() => {
    vi.clearAllMocks()
    mockChild = createMockChild()
    vi.mocked(spawn).mockReturnValue(mockChild as unknown as ReturnType<typeof spawn>)
    git = new Git("/test/repo")
  })

  describe("add", () => {
    it("should stage specified files", async () => {
      const result = git.add(["src/test.ts", "src/utils.ts"])

      // Simulate successful completion
      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      await expect(result).resolves.toMatchObject({
        success: true,
        output: "",
      })
      expect(spawn).toHaveBeenCalledWith("git", ["add", "src/test.ts", "src/utils.ts"], expect.any(Object))
    })

    it("should stage all changes with dot", async () => {
      const result = git.add(["."])

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      await expect(result).resolves.toMatchObject({ success: true })
      expect(spawn).toHaveBeenCalledWith("git", ["add", "."], expect.any(Object))
    })

    it("should fail on non-zero exit code", async () => {
      const result = git.add(["nonexistent.ts"])

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from("fatal: pathspec 'nonexistent.ts' did not match any files"))
      mockChild.emit("close", 128)

      const res = await result
      expect(res.success).toBe(false)
      expect(res.error).toContain("fatal")
    })

    it("should handle spawn error", async () => {
      const result = git.add(["file.ts"])

      mockChild.emit("error", new Error("ENOENT: git not found"))

      await expect(result).resolves.toMatchObject({
        success: false,
        error: "ENOENT: git not found",
      })
    })
  })

  describe("commit", () => {
    it("should create a commit with message", async () => {
      const result = git.commit("feat: add login")

      mockChild.stdout.emit("data", Buffer.from("[main abc1234] feat: add login\n 1 file changed, 10 insertions(+)"))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      await expect(result).resolves.toMatchObject({
        success: true,
        output: expect.stringContaining("feat: add login"),
      })
      expect(spawn).toHaveBeenCalledWith("git", ["commit", "-m", "feat: add login"], expect.any(Object))
    })

    it("should include author when provided", async () => {
      const result = git.commit("fix: typo", { author: "Alice <alice@example.com>" })

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      await expect(result).resolves.toMatchObject({ success: true })
      expect(spawn).toHaveBeenCalledWith(
        "git",
        ["commit", "-m", "fix: typo", "--author", "Alice <alice@example.com>"],
        expect.any(Object),
      )
    })

    it("should pass --allow-empty when set", async () => {
      const result = git.commit("empty commit", { allowEmpty: true })

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      await expect(result).resolves.toMatchObject({ success: true })
      expect(spawn).toHaveBeenCalledWith(
        "git",
        ["commit", "-m", "empty commit", "--allow-empty"],
        expect.any(Object),
      )
    })

    it("should fail when nothing to commit", async () => {
      const result = git.commit("empty")

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from("nothing to commit"))
      mockChild.emit("close", 1)

      const res = await result
      expect(res.success).toBe(false)
      expect(res.error).toContain("nothing to commit")
    })
  })

  describe("getStatus", () => {
    it("should parse porcelain output into files", async () => {
      const result = git.getStatus()

      const porcelain = [
        "M  src/index.ts",
        " M src/utils.ts",
        "AM src/new.ts",
        "?? untracked.md",
        " D src/deleted.ts",
      ].join("\n")

      mockChild.stdout.emit("data", Buffer.from(porcelain))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      const res = await result
      expect(res.success).toBe(true)
      expect(res.files).toHaveLength(5)
      expect(res.staged).toEqual(["src/index.ts", "src/new.ts"])
      expect(res.unstaged).toEqual(["src/utils.ts", "src/new.ts", "src/deleted.ts"])
      expect(res.untracked).toEqual(["untracked.md"])
    })

    it("should handle empty status", async () => {
      const result = git.getStatus()

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      const res = await result
      expect(res.success).toBe(true)
      expect(res.files).toHaveLength(0)
      expect(res.staged).toHaveLength(0)
      expect(res.unstaged).toHaveLength(0)
      expect(res.untracked).toHaveLength(0)
    })

    it("should fail on git error", async () => {
      const result = git.getStatus()

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from("fatal: not a git repository"))
      mockChild.emit("close", 128)

      const res = await result
      expect(res.success).toBe(false)
      expect(res.files).toHaveLength(0)
    })

    it("should handle porcelain with renamed files", async () => {
      const result = git.getStatus()

      const porcelain = "R  src/old.ts -> src/new.ts\n"

      mockChild.stdout.emit("data", Buffer.from(porcelain))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      const res = await result
      expect(res.success).toBe(true)
      expect(res.files).toHaveLength(1)
      expect(res.files[0].status).toBe("R ")
      expect(res.files[0].file).toBe("src/old.ts -> src/new.ts")
      expect(res.staged).toHaveLength(1)
    })
  })

  describe("getDiffStaged", () => {
    it("should return parsed shortstat output", async () => {
      const result = git.getDiffStaged()

      const diffOutput = " 2 files changed, 5 insertions(+), 3 deletions(-)"

      mockChild.stdout.emit("data", Buffer.from(diffOutput))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      const res = await result
      expect(res.success).toBe(true)
      expect(res.diff).toBe(diffOutput)
      expect(res.filesChanged).toBe(2)
      expect(res.insertions).toBe(5)
      expect(res.deletions).toBe(3)
    })

    it("should handle empty diff", async () => {
      const result = git.getDiffStaged()

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      const res = await result
      expect(res.success).toBe(true)
      expect(res.diff).toBe("")
      expect(res.filesChanged).toBe(0)
      expect(res.insertions).toBe(0)
      expect(res.deletions).toBe(0)
    })

    it("should fail on git error", async () => {
      const result = git.getDiffStaged()

      mockChild.stderr.emit("data", Buffer.from("fatal: ambiguous argument"))
      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.emit("close", 128)

      const res = await result
      expect(res.success).toBe(false)
      expect(res.diff).toBe("")
    })
  })

  describe("default cwd", () => {
    it("should use process.cwd() when no path provided", async () => {
      const defaultGit = new Git()
      const result = defaultGit.getStatus()

      mockChild.stdout.emit("data", Buffer.from(""))
      mockChild.stderr.emit("data", Buffer.from(""))
      mockChild.emit("close", 0)

      await result
      expect(spawn).toHaveBeenCalledWith("git", ["status", "--porcelain"], expect.objectContaining({
        cwd: process.cwd(),
      }))
    })
  })
})
