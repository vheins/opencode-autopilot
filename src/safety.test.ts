import { describe, it, expect } from "vitest"
import { SafetyChecker, defaultSafetyChecker } from "./safety.js"

describe("SafetyChecker", () => {
  const checker = new SafetyChecker()
  const projectDir = "/test/project"

  describe("path-traversal", () => {
    it("should allow files inside project directory", () => {
      const result = checker.check("src/auth.ts", projectDir)
      expect(result.allowed).toBe(true)
    })

    it("should deny path traversal with ../", () => {
      const result = checker.check("../../etc/passwd", projectDir)
      expect(result.allowed).toBe(false)
      expect(result.rule).toBe("path-traversal")
    })

    it("should deny path traversal via sibling directory", () => {
      // /test/project-other would incorrectly match /test/project without separator check
      const result = checker.check("../project-other/secret.txt", projectDir)
      expect(result.allowed).toBe(false)
      expect(result.rule).toBe("path-traversal")
    })
  })

  describe("protected-files", () => {
    it("should deny modifications to package.json", () => {
      const result = checker.check("package.json", projectDir)
      expect(result.allowed).toBe(false)
      expect(result.rule).toBe("protected-files")
    })

    it("should deny modifications to package-lock.json", () => {
      const result = checker.check("package-lock.json", projectDir)
      expect(result.allowed).toBe(false)
    })

    it("should deny node_modules", () => {
      const result = checker.check("node_modules/express/index.js", projectDir)
      expect(result.allowed).toBe(false)
    })

    it("should deny .git directory", () => {
      const result = checker.check(".git/HEAD", projectDir)
      expect(result.allowed).toBe(false)
    })

    it("should deny opencode.json", () => {
      const result = checker.check("opencode.json", projectDir)
      expect(result.allowed).toBe(false)
    })

    it("should deny tsconfig.json", () => {
      const result = checker.check("tsconfig.json", projectDir)
      expect(result.allowed).toBe(false)
    })
  })

  describe("allowed-directory", () => {
    it("should allow src/ directory", () => {
      const result = checker.check("src/auth.ts", projectDir)
      expect(result.allowed).toBe(true)
    })

    it("should allow tests/ directory", () => {
      const result = checker.check("tests/auth.test.ts", projectDir)
      expect(result.allowed).toBe(true)
    })

    it("should deny dist/ directory by default", () => {
      const result = checker.check("dist/bundle.js", projectDir)
      expect(result.allowed).toBe(false)
      expect(result.rule).toBe("allowed-directory")
    })

    it("should deny root-level files not in allowed dirs", () => {
      const result = checker.check("some_random_file.ts", projectDir)
      expect(result.allowed).toBe(false)
    })
  })

  describe("allowed-extension", () => {
    it("should allow .ts files", () => {
      const result = checker.check("src/file.ts", projectDir)
      expect(result.allowed).toBe(true)
    })

    it("should allow .tsx files", () => {
      const result = checker.check("src/Component.tsx", projectDir)
      expect(result.allowed).toBe(true)
    })

    it("should allow .css files", () => {
      const result = checker.check("src/styles.css", projectDir)
      expect(result.allowed).toBe(true)
    })

    it("should deny .exe files", () => {
      const result = checker.check("src/file.exe", projectDir)
      expect(result.allowed).toBe(false)
      expect(result.rule).toBe("allowed-extension")
    })

    it("should deny .dll files", () => {
      const result = checker.check("src/lib.dll", projectDir)
      expect(result.allowed).toBe(false)
    })

    it("should allow files without extension (directories)", () => {
      const result = checker.check("src/utils", projectDir)
      expect(result.allowed).toBe(true)
    })
  })

  describe("filter", () => {
    it("should separate allowed and denied files", () => {
      const files = [
        { path: "src/auth.ts" },
        { path: "package.json" },
        { path: "tests/auth.test.ts" },
        { path: "node_modules/express/index.js" },
      ]
      const result = checker.filter(files, projectDir)
      expect(result.allowed).toHaveLength(2)
      expect(result.denied).toHaveLength(2)
      expect(result.allowed.map((f) => f.path)).toEqual([
        "src/auth.ts",
        "tests/auth.test.ts",
      ])
      expect(result.denied.map((f) => f.path)).toEqual([
        "package.json",
        "node_modules/express/index.js",
      ])
    })

    it("should include reasons for denied files", () => {
      const files = [{ path: "package.json" }, { path: "dist/bundle.js" }]
      const result = checker.filter(files, projectDir)
      expect(result.denied.length).toBeGreaterThan(0)
      for (const d of result.denied) {
        expect(d.reason).toBeDefined()
        expect(d.reason!.length).toBeGreaterThan(0)
      }
    })

    it("should return empty allowed when all files rejected", () => {
      const files = [
        { path: "node_modules/pkg/index.js" },
        { path: ".git/config" },
      ]
      const result = checker.filter(files, projectDir)
      expect(result.allowed).toHaveLength(0)
      expect(result.denied).toHaveLength(2)
    })
  })

  describe("max-file-size", () => {
    it("should allow files under max size", () => {
      const smallContent = "x".repeat(1000)
      const result = checker.check("src/file.ts", projectDir, {
        content: smallContent,
      })
      expect(result.allowed).toBe(true)
    })

    it("should deny files exceeding max size", () => {
      const largeContent = "x".repeat(200000) // > 100KB
      const result = checker.check("src/file.ts", projectDir, {
        content: largeContent,
      })
      expect(result.allowed).toBe(false)
      expect(result.rule).toBe("max-file-size")
    })
  })

  describe("custom rules", () => {
    it("should allow adding custom rules", () => {
      const custom = new SafetyChecker()
      custom.addRule({
        name: "no-temp",
        validate: (filePath) => {
          if (filePath.includes("/tmp/")) {
            return { allowed: false, reason: "File in temp directory" }
          }
          return { allowed: true }
        },
      })

      const result = custom.check("src/tmp/scratch.ts", projectDir)
      expect(result.allowed).toBe(false)
      expect(result.rule).toBe("no-temp")
    })

    it("should pass custom rules before built-in rules", () => {
      const custom = new SafetyChecker()
      custom.addRule({
        name: "block-all",
        validate: () => ({ allowed: false, reason: "Blocked by custom rule" }),
      })

      const result = custom.check("src/auth.ts", projectDir)
      expect(result.allowed).toBe(false)
      expect(result.rule).toBe("block-all")
    })
  })

  describe("defaultSafetyChecker", () => {
    it("should be a singleton instance", () => {
      expect(defaultSafetyChecker).toBeInstanceOf(SafetyChecker)
    })

    it("should use default config", () => {
      const config = defaultSafetyChecker.getConfig()
      expect(config.maxFilesPerIteration).toBe(20)
      expect(config.maxFileSize).toBe(102400)
    })
  })

  describe("getConfig", () => {
    it("should return a copy of config", () => {
      const config = checker.getConfig()
      config.maxFilesPerIteration = 999
      // Original should be unchanged
      expect(checker.getConfig().maxFilesPerIteration).toBe(20)
    })
  })
})
