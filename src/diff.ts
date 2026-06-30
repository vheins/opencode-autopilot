export interface DiffEntry {
  filePath: string
  type: "added" | "modified" | "deleted"
  insertions: number
  deletions: number
  hunks: DiffHunk[]
}

export interface DiffHunk {
  oldStart: number
  oldLines: number
  newStart: number
  newLines: number
  content: string
}

export interface DiffResult {
  files: DiffEntry[]
  totalInsertions: number
  totalDeletions: number
  raw: string
}

/**
 * Generate a simple unified diff between old and new content
 */
export function generateDiff(oldContent: string, newContent: string, filePath: string): DiffEntry {
  const oldLines = oldContent === "" ? [] : oldContent.split("\n")
  const newLines = newContent === "" ? [] : newContent.split("\n")

  // Simple line-by-line comparison
  const insertions = newLines.filter((l) => !oldLines.includes(l)).length
  const deletions = oldLines.filter((l) => !newLines.includes(l)).length

  const type: "added" | "modified" | "deleted" =
    oldContent === "" ? "added" :
    newContent === "" ? "deleted" :
    "modified"

  return {
    filePath,
    type,
    insertions,
    deletions,
    hunks: [{
      oldStart: 1,
      oldLines: oldLines.length,
      newStart: 1,
      newLines: newLines.length,
      content: generateUnifiedDiff(oldLines, newLines),
    }],
  }
}

function generateUnifiedDiff(oldLines: string[], newLines: string[]): string {
  const result: string[] = []
  const maxLen = Math.max(oldLines.length, newLines.length)

  for (let i = 0; i < maxLen; i++) {
    if (i >= oldLines.length) {
      result.push(`+${newLines[i]}`)
    } else if (i >= newLines.length) {
      result.push(`-${oldLines[i]}`)
    } else if (oldLines[i] !== newLines[i]) {
      result.push(`-${oldLines[i]}`)
      result.push(`+${newLines[i]}`)
    } else {
      result.push(` ${oldLines[i]}`)
    }
  }

  return result.join("\n")
}

/**
 * Format diff for display
 */
export function formatDiff(diff: DiffResult): string {
  let output = ""

  output += `## Diff Summary\n\n`
  output += `**${diff.files.length} file(s) changed**\n`
  output += `**+${diff.totalInsertions} / -${diff.totalDeletions}**\n\n`

  for (const file of diff.files) {
    const icon = file.type === "added" ? "＋" : file.type === "deleted" ? "−" : "✎"
    output += `${icon} ${file.filePath} (+${file.insertions}/-${file.deletions})\n`
  }

  return output
}
