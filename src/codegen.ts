import { promises as fs } from "fs"
import { dirname, resolve } from "path"
import { defaultSafetyChecker } from "./safety.js"
import { generateDiff, type DiffResult } from "./diff.js"

export interface FileChange {
  path: string
  content: string
  language: string
  action: "create" | "modify"
}

export interface CodeGenResult {
  files: FileChange[]
  raw: string
}

export interface WriteResult {
  written: string[]
  skipped: string[]
  errors: { path: string; error: string }[]
  diff?: DiffResult
}

/**
 * Parse AI code generation output into structured file changes.
 * Expects format:
 * ## File: path/to/file.ts
 * ```typescript
 * // content
 * ```
 */
export function parseCodeGenOutput(raw: string): CodeGenResult {
  const files: FileChange[] = []

  // Match ## File: path blocks with code blocks
  const fileBlockRegex = /## File: (.+?)\n```(\w+)?\n([\s\S]*?)```/g
  let match

  while ((match = fileBlockRegex.exec(raw)) !== null) {
    const path = match[1].trim()
    const language = match[2] || "typescript"
    const content = match[3].trim()

    files.push({
      path,
      content,
      language,
      action: "create", // We'll determine create vs modify later
    })
  }

  return { files, raw }
}

/**
 * Write files to disk with safety checks, backup, and diff capture.
 *
 * - Runs all files through the safety checker first
 * - Creates backups of existing files when createBackup is true
 * - Automatically creates parent directories
 * - Captures before/after diff using generateDiff()
 * - Prevents path traversal attacks
 *
 * @param files - Array of file changes to write
 * @param projectDir - Absolute path to the project root
 * @param options - Optional settings (dryRun, createBackup)
 * @returns WriteResult with written/skipped/errors lists and diff summary
 */
export async function writeFiles(
  files: FileChange[],
  projectDir: string,
  options: { dryRun?: boolean; createBackup?: boolean } = {},
): Promise<WriteResult> {
  const result: WriteResult = { written: [], skipped: [], errors: [] }
  const oldContents: Map<string, string> = new Map()
  const newContents: Map<string, string> = new Map()
  const backupDir = options.createBackup
    ? resolve(projectDir, ".autopilot", "backups", String(Date.now()))
    : null

  // Run safety checks first
  const checker = defaultSafetyChecker
  const { allowed, denied } = checker.filter(files, projectDir)
  for (const d of denied) {
    result.skipped.push(d.path)
    result.errors.push({ path: d.path, error: `Safety check denied: ${d.reason}` })
  }

  const allowedPaths = new Set(allowed.map(a => a.path))

  // Phase 1: Read existing content for diff capture and detect modify vs create
  for (const file of files) {
    if (!allowedPaths.has(file.path)) {
      // Already marked as denied above
      continue
    }

    const fullPath = resolve(projectDir, file.path)

    // Defense-in-depth path traversal check
    if (!fullPath.startsWith(resolve(projectDir))) {
      result.errors.push({ path: file.path, error: "Path traversal detected" })
      continue
    }

    try {
      const existingContent = await fs.readFile(fullPath, "utf-8")
      oldContents.set(file.path, existingContent)
      file.action = "modify"
    } catch {
      // File doesn't exist yet — that's the create case
      file.action = "create"
    }

    newContents.set(file.path, file.content)
  }

  if (options.dryRun) {
    result.written = files
      .filter(f => allowedPaths.has(f.path))
      .map(f => f.path)
    return result
  }

  // Phase 2: Create backup directory if needed
  if (backupDir) {
    await fs.mkdir(backupDir, { recursive: true })
  }

  // Phase 3: Write all files
  for (const file of files) {
    if (!allowedPaths.has(file.path)) continue

    const fullPath = resolve(projectDir, file.path)

    // Skip files that already had errors (e.g. path traversal)
    if (result.errors.some(e => e.path === file.path)) continue

    try {
      // Create backup of existing file before overwriting
      if (backupDir && oldContents.has(file.path)) {
        const backupPath = resolve(backupDir, file.path)
        await fs.mkdir(dirname(backupPath), { recursive: true })
        await fs.writeFile(backupPath, oldContents.get(file.path)!, "utf-8")
      }

      // Ensure parent directory exists and write the file
      await fs.mkdir(dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, file.content, "utf-8")
      result.written.push(file.path)
    } catch (e: any) {
      result.errors.push({ path: file.path, error: e.message })
    }
  }

  // Phase 4: Generate diff from old → new content
  const diffFiles = files
    .filter(f => allowedPaths.has(f.path) && !result.errors.some(e => e.path === f.path))
    .map(f => generateDiff(
      oldContents.get(f.path) || "",
      newContents.get(f.path) || "",
      f.path,
    ))

  result.diff = {
    files: diffFiles,
    totalInsertions: diffFiles.reduce((a, d) => a + d.insertions, 0),
    totalDeletions: diffFiles.reduce((a, d) => a + d.deletions, 0),
    raw: "",
  }

  return result
}
