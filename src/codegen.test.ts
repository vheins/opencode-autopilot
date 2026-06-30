import { describe, it, expect } from "vitest"
import { parseCodeGenOutput } from "./codegen.js"
import { generateDiff, formatDiff } from "./diff.js"

describe("parseCodeGenOutput", () => {
  it("should parse single file output", () => {
    const input = "## File: src/auth.ts\n```typescript\nconst x = 1\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].path).toBe("src/auth.ts")
    expect(result.files[0].content).toBe("const x = 1")
  })

  it("should parse multiple files", () => {
    const input =
      "## File: src/a.ts\n```ts\n// a\n```\n## File: src/b.ts\n```ts\n// b\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(2)
    expect(result.files[0].path).toBe("src/a.ts")
    expect(result.files[1].path).toBe("src/b.ts")
  })

  it("should handle empty output", () => {
    const result = parseCodeGenOutput("")
    expect(result.files).toHaveLength(0)
  })

  it("should handle different languages", () => {
    const input = "## File: test.css\n```css\nbody {}\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].language).toBe("css")
  })

  it("should handle multiline content", () => {
    const input = "## File: src/app.ts\n```ts\nline1\nline2\nline3\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files[0].content).toBe("line1\nline2\nline3")
  })

  it("should default language to typescript when no code fence language", () => {
    const input = "## File: src/default.ts\n```\nconst x = 1\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files[0].language).toBe("typescript")
  })

  it("should parse files with different language identifiers", () => {
    const input =
      "## File: src/a.ts\n```typescript\nexport const a = 1\n```\n## File: src/b.py\n```python\nprint('hello')\n```\n## File: src/c.jsx\n```jsx\nfunction C() { return null }\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(3)
    expect(result.files[0].language).toBe("typescript")
    expect(result.files[1].language).toBe("python")
    expect(result.files[2].language).toBe("jsx")
  })

  it("should preserve whitespace in file paths", () => {
    const input = '## File: src/my folder/file.ts\n```ts\nconst x = 1\n```'
    const result = parseCodeGenOutput(input)
    expect(result.files[0].path).toBe("src/my folder/file.ts")
  })

  it("should return raw input unchanged", () => {
    const input = "## File: src/a.ts\n```ts\n// a\n```"
    const result = parseCodeGenOutput(input)
    expect(result.raw).toBe(input)
  })

  it("should handle multiple files with varying content lengths", () => {
    const input =
      "## File: src/a.ts\n```ts\nconst a = 1\n```\n## File: src/b.ts\n```ts\nconst b = 2\nconst c = 3\n```\n## File: src/c.ts\n```ts\nconst d = 4\nconst e = 5\nconst f = 6\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(3)
    expect(result.files[0].content).toBe("const a = 1")
    expect(result.files[1].content).toBe("const b = 2\nconst c = 3")
    expect(result.files[2].content).toBe("const d = 4\nconst e = 5\nconst f = 6")
  })

  it("should handle output with leading/trailing text outside code blocks", () => {
    const input =
      "Here is the generated code:\n\n## File: src/util.ts\n```ts\nexport function util() {}\n```\n\nThat's all."
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].path).toBe("src/util.ts")
  })

  it("should ignore text not matching the file block pattern", () => {
    const input =
      "## File: src/a.ts\n```ts\n// a\n```\nSome random text\n## File: src/b.ts\n```ts\n// b\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(2)
  })

  it("should handle empty code blocks", () => {
    const input = "## File: src/empty.ts\n```ts\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].content).toBe("")
  })

  it("should parse files with path in subdirectories", () => {
    const input =
      "## File: src/deep/nested/file.ts\n```ts\nconst deep = true\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files[0].path).toBe("src/deep/nested/file.ts")
  })

  it("should handle code blocks with special characters", () => {
    const input =
      "## File: src/special.ts\n```ts\nconst regex = /test/g\nconst template = `hello ${name}`\nconst backtick = \\`code\\`\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files).toHaveLength(1)
    expect(result.files[0].content).toContain("const regex = /test/g")
  })

  it("should trim whitespace from file paths", () => {
    const input = "## File:   src/trimmed.ts   \n```ts\nconst x = 1\n```"
    const result = parseCodeGenOutput(input)
    expect(result.files[0].path).toBe("src/trimmed.ts")
  })
})

describe("generateDiff", () => {
  it("should detect added file", () => {
    const diff = generateDiff("", "new content", "new.ts")
    expect(diff.type).toBe("added")
    expect(diff.insertions).toBeGreaterThan(0)
    expect(diff.deletions).toBe(0)
  })

  it("should detect modified file", () => {
    const diff = generateDiff("old content", "new content", "file.ts")
    expect(diff.type).toBe("modified")
  })

  it("should detect deleted file", () => {
    const diff = generateDiff("old content", "", "file.ts")
    expect(diff.type).toBe("deleted")
    expect(diff.deletions).toBeGreaterThan(0)
    expect(diff.insertions).toBe(0)
  })

  it("should count insertions correctly", () => {
    const diff = generateDiff("line1\nline2", "line1\nline2\nline3", "f.ts")
    expect(diff.insertions).toBeGreaterThanOrEqual(1)
  })

  it("should count deletions correctly", () => {
    const diff = generateDiff("line1\nline2\nline3", "line1\nline2", "f.ts")
    expect(diff.deletions).toBeGreaterThanOrEqual(1)
  })

  it("should return zero insertions/deletions for identical content", () => {
    const diff = generateDiff("same content", "same content", "f.ts")
    expect(diff.type).toBe("modified")
    expect(diff.insertions).toBe(0)
    expect(diff.deletions).toBe(0)
  })

  it("should set filePath on result", () => {
    const diff = generateDiff("old", "new", "src/test.ts")
    expect(diff.filePath).toBe("src/test.ts")
  })

  it("should generate hunks array with one entry", () => {
    const diff = generateDiff("old", "new", "f.ts")
    expect(diff.hunks).toHaveLength(1)
    expect(diff.hunks[0]).toHaveProperty("oldStart", 1)
    expect(diff.hunks[0]).toHaveProperty("newStart", 1)
  })

  it("should set hunk line counts correctly", () => {
    const oldLines = ["a", "b", "c"]
    const newLines = ["a", "d", "c", "e"]
    const diff = generateDiff(oldLines.join("\n"), newLines.join("\n"), "f.ts")
    expect(diff.hunks[0].oldLines).toBe(3)
    expect(diff.hunks[0].newLines).toBe(4)
  })

  it("should handle both empty old and new content", () => {
    const diff = generateDiff("", "", "f.ts")
    expect(diff.type).toBe("added")
    expect(diff.insertions).toBe(0)
    expect(diff.deletions).toBe(0)
  })

  it("should generate hunk content with unified diff markers", () => {
    const diff = generateDiff("old", "new", "f.ts")
    expect(diff.hunks[0].content).toContain("-old")
    expect(diff.hunks[0].content).toContain("+new")
  })

  it("should count insertions when new lines are added at the end", () => {
    const diff = generateDiff("a\nb", "a\nb\nc\nd", "f.ts")
    expect(diff.insertions).toBe(2)
  })

  it("should count deletions when lines are removed at the end", () => {
    const diff = generateDiff("a\nb\nc", "a\nb", "f.ts")
    expect(diff.deletions).toBe(1)
  })

  it("should count insertions for entirely new content", () => {
    const diff = generateDiff("", "new\ncontent", "f.ts")
    expect(diff.insertions).toBe(2)
  })

  it("should count deletions for entirely removed content", () => {
    const diff = generateDiff("old\ncontent", "", "f.ts")
    expect(diff.deletions).toBe(2)
  })
})

describe("formatDiff", () => {
  it("should format diff summary", () => {
    const diff = {
      files: [
        {
          filePath: "src/a.ts",
          type: "modified" as const,
          insertions: 3,
          deletions: 1,
          hunks: [],
        },
      ],
      totalInsertions: 3,
      totalDeletions: 1,
      raw: "",
    }
    const output = formatDiff(diff)
    expect(output).toContain("src/a.ts")
    expect(output).toContain("+3")
    expect(output).toContain("-1")
  })

  it("should show file count in summary", () => {
    const diff = {
      files: [
        {
          filePath: "src/a.ts",
          type: "modified" as const,
          insertions: 1,
          deletions: 0,
          hunks: [],
        },
      ],
      totalInsertions: 1,
      totalDeletions: 0,
      raw: "",
    }
    const output = formatDiff(diff)
    expect(output).toContain("1 file(s) changed")
  })

  it("should show multiple files with different types", () => {
    const diff = {
      files: [
        {
          filePath: "src/new.ts",
          type: "added" as const,
          insertions: 5,
          deletions: 0,
          hunks: [],
        },
        {
          filePath: "src/delete.ts",
          type: "deleted" as const,
          insertions: 0,
          deletions: 3,
          hunks: [],
        },
        {
          filePath: "src/mod.ts",
          type: "modified" as const,
          insertions: 2,
          deletions: 1,
          hunks: [],
        },
      ],
      totalInsertions: 7,
      totalDeletions: 4,
      raw: "",
    }
    const output = formatDiff(diff)
    expect(output).toContain("3 file(s) changed")
    expect(output).toContain("+7")
    expect(output).toContain("-4")
    expect(output).toContain("src/new.ts")
    expect(output).toContain("src/delete.ts")
    expect(output).toContain("src/mod.ts")
    expect(output).toContain("+5/-0")
    expect(output).toContain("+0/-3")
    expect(output).toContain("+2/-1")
  })

  it("should show zero totals", () => {
    const diff = {
      files: [],
      totalInsertions: 0,
      totalDeletions: 0,
      raw: "",
    }
    const output = formatDiff(diff)
    expect(output).toContain("0 file(s) changed")
    expect(output).toContain("+0")
    expect(output).toContain("-0")
  })

  it("should include Diff Summary header", () => {
    const diff = {
      files: [],
      totalInsertions: 0,
      totalDeletions: 0,
      raw: "",
    }
    const output = formatDiff(diff)
    expect(output).toContain("## Diff Summary")
  })

  it("should handle single file with large numbers", () => {
    const diff = {
      files: [
        {
          filePath: "src/big.ts",
          type: "modified" as const,
          insertions: 150,
          deletions: 20,
          hunks: [],
        },
      ],
      totalInsertions: 150,
      totalDeletions: 20,
      raw: "",
    }
    const output = formatDiff(diff)
    expect(output).toContain("+150")
    expect(output).toContain("-20")
  })
})
