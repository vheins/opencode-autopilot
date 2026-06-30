export interface PlanFile {
  path: string
  action: "create" | "modify" | "delete"
  description: string
}

export interface PlanStep {
  order: number
  description: string
}

export interface ParsedPlan {
  summary: string
  files: PlanFile[]
  steps: PlanStep[]
  risks: string[]
  effort: "S" | "M" | "L" | "XL"
  raw: string
}

export function parsePlan(raw: string): ParsedPlan {
  const plan: ParsedPlan = {
    summary: "",
    files: [],
    steps: [],
    risks: [],
    effort: "M",
    raw,
  }

  // Extract summary
  const summaryMatch = raw.match(/## Plan Summary\n(.+)/)
  if (summaryMatch) plan.summary = summaryMatch[1].trim()

  // Extract files
  const fileLines = raw.match(/^- ([^\n]+): (.+)$/gm)
  if (fileLines) {
    for (const line of fileLines) {
      const match = line.match(/^- ([^\n]+): (.+)$/)
      if (match) {
        const path = match[1].trim()
        const desc = match[2].trim()
        plan.files.push({
          path,
          action: desc.toLowerCase().includes("create") ? "create" : "modify",
          description: desc,
        })
      }
    }
  }

  // Extract steps
  const stepLines = raw.match(/^\d+\. (.+)$/gm)
  if (stepLines) {
    stepLines.forEach((line, i) => {
      const desc = line.replace(/^\d+\. /, "").trim()
      plan.steps.push({ order: i + 1, description: desc })
    })
  }

  // Extract effort
  const effortMatch = raw.match(/## Effort: ([SML]|XL)/)
  if (effortMatch) plan.effort = effortMatch[1] as any

  // Extract risks
  const riskLines = raw.match(/^- ([^-].+)$/gm)
  if (riskLines) {
    // Filter out file lines (they start with path/)
    const files = plan.files.map(f => f.path)
    for (const line of riskLines) {
      const risk = line.replace(/^- /, "").trim()
      if (!files.some(f => risk.startsWith(f.split("/")[0]))) {
        plan.risks.push(risk)
      }
    }
  }

  return plan
}

export function formatPlanForDisplay(plan: ParsedPlan): string {
  let output = `## Plan: ${plan.summary}\n\n`
  output += `**Effort:** ${plan.effort}\n\n`

  output += "### Files\n"
  for (const file of plan.files) {
    output += `- ${file.path} (${file.action}) — ${file.description}\n`
  }

  output += "\n### Steps\n"
  for (const step of plan.steps) {
    output += `${step.order}. ${step.description}\n`
  }

  if (plan.risks.length > 0) {
    output += "\n### Risks\n"
    for (const risk of plan.risks) {
      output += `- ⚠️ ${risk}\n`
    }
  }

  return output
}
