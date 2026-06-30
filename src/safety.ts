import path from "path"

export interface SafetyRule {
  name: string
  validate(path: string, projectDir: string, fileCount?: number): { allowed: boolean; reason?: string }
}

export type SafetyAction = "allow" | "deny" | "warn"

export interface SafetyCheckResult {
  allowed: boolean
  action: SafetyAction
  reason?: string
  rule?: string
}

export interface SafetyConfig {
  /** Directories that can be modified */
  allowedDirs: string[]
  /** Files that must never be modified */
  protectedFiles: string[]
  /** File extensions that are safe to create */
  allowedExtensions: string[]
  /** Max file size in bytes */
  maxFileSize: number
  /** Max files per iteration */
  maxFilesPerIteration: number
}

const DEFAULT_CONFIG: SafetyConfig = {
  allowedDirs: ["src/", "tests/", "lib/", "app/", "components/"],
  protectedFiles: [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".gitignore",
    "opencode.json",
    "opencode.jsonc",
    "node_modules/",
    ".git/",
  ],
  allowedExtensions: [
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".css", ".scss", ".less",
    ".html", ".vue", ".svelte",
    ".json", ".yaml", ".yml", ".toml",
    ".md", ".txt",
    ".prisma", ".graphql",
    ".env.example",
  ],
  maxFileSize: 1024 * 100, // 100KB
  maxFilesPerIteration: 20,
}

export class SafetyChecker {
  private config: SafetyConfig
  private rules: SafetyRule[] = []

  constructor(config: Partial<SafetyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initDefaultRules()
  }

  private initDefaultRules(): void {
    this.addRule({
      name: "path-traversal",
      validate: (filePath, projectDir) => {
        const resolvedProjectDir = path.resolve(projectDir)
        const resolved = path.resolve(resolvedProjectDir, filePath)
        const isWithin =
          resolved === resolvedProjectDir ||
          resolved.startsWith(resolvedProjectDir + path.sep)
        return {
          allowed: isWithin,
          reason: isWithin
            ? undefined
            : `Path traversal detected — file "${filePath}" resolves outside project directory`,
        }
      },
    })

    this.addRule({
      name: "protected-files",
      validate: (filePath) => {
        const isProtected = this.config.protectedFiles.some(
          (p) => filePath === p || filePath.startsWith(p)
        )
        return {
          allowed: !isProtected,
          reason: isProtected
            ? `File "${filePath}" is protected and cannot be modified`
            : undefined,
        }
      },
    })

    this.addRule({
      name: "allowed-directory",
      validate: (filePath) => {
        const isAllowed = this.config.allowedDirs.some((d) => filePath.startsWith(d))
        return {
          allowed: isAllowed,
          reason: isAllowed
            ? undefined
            : `Path "${filePath}" is outside allowed directories: ${this.config.allowedDirs.join(", ")}`,
        }
      },
    })

    this.addRule({
      name: "allowed-extension",
      validate: (filePath) => {
        const ext = path.extname(filePath)
        if (ext === "") {
          return { allowed: true }
        }
        const isAllowed = this.config.allowedExtensions.includes(ext)
        return {
          allowed: isAllowed,
          reason: isAllowed
            ? undefined
            : `File extension "${ext}" is not in allowed list`,
        }
      },
    })

    this.addRule({
      name: "max-files-per-iteration",
      validate: (_filePath, _projectDir, fileCount) => {
        const withinLimit = !fileCount || fileCount <= this.config.maxFilesPerIteration
        return {
          allowed: withinLimit,
          reason: withinLimit
            ? undefined
            : `Too many files (${fileCount} > ${this.config.maxFilesPerIteration} max)`,
        }
      },
    })
  }

  addRule(rule: SafetyRule): void {
    this.rules.push(rule)
  }

  /**
   * Check if a file operation is safe
   */
  check(
    filePath: string,
    projectDir: string,
    options?: { content?: string; fileCount?: number },
  ): SafetyCheckResult {
    for (const rule of this.rules) {
      const result = rule.validate(filePath, projectDir, options?.fileCount)
      if (!result.allowed) {
        return {
          allowed: false,
          action: "deny",
          reason: result.reason,
          rule: rule.name,
        }
      }
    }

    // Check file size
    if (options?.content && options.content.length > this.config.maxFileSize) {
      return {
        allowed: false,
        action: "deny",
        reason: `File content exceeds max size (${options.content.length} > ${this.config.maxFileSize} bytes)`,
        rule: "max-file-size",
      }
    }

    return { allowed: true, action: "allow" }
  }

  /**
   * Filter a list of file changes, returning only safe ones
   */
  filter(
    files: Array<{ path: string }>,
    projectDir: string,
  ): {
    allowed: Array<{ path: string }>
    denied: Array<{ path: string; reason: string }>
  } {
    const allowed: Array<{ path: string }> = []
    const denied: Array<{ path: string; reason: string }> = []

    for (const file of files) {
      const result = this.check(file.path, projectDir, { fileCount: files.length })
      if (result.allowed) {
        allowed.push(file)
      } else {
        denied.push({ path: file.path, reason: result.reason || "Unknown" })
      }
    }

    return { allowed, denied }
  }

  getConfig(): SafetyConfig {
    return { ...this.config }
  }
}

export const defaultSafetyChecker = new SafetyChecker()
