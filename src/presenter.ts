import type { ParsedPlan } from "./plan-parser.js"
import type { DiffResult } from "./diff.js"
import { IterationPhase } from "./types.js"

export interface PresentationOptions {
  colors?: boolean
  compact?: boolean
  timeout?: number // seconds, default 60
}

export class Presenter {
  private options: PresentationOptions

  constructor(options: PresentationOptions = { colors: true, compact: false, timeout: 60 }) {
    this.options = { ...options, timeout: options.timeout ?? 60 }
  }

  /** Present a plan to the user */
  presentPlan(plan: ParsedPlan, sessionId?: string): string {
    const timestamp = new Date().toISOString()
    const lines: string[] = []
    lines.push("")
    lines.push("═".repeat(60))
    lines.push("  AUTOPILOT — Implementation Plan")
    lines.push("═".repeat(60))
    lines.push("")
    if (sessionId) {
      lines.push(`  Session: ${sessionId.slice(0, 8)}...`)
    }
    lines.push(`  Time: ${timestamp}`)
    lines.push(`  Timeout: ${this.options.timeout}s`)
    lines.push("")
    lines.push(`  ${plan.summary}`)
    lines.push(`  Effort: ${plan.effort}`)
    lines.push("")
    lines.push("  ─ Files ─")
    for (const file of plan.files) {
      const icon = file.action === "create" ? "＋" : file.action === "delete" ? "−" : "✎"
      lines.push(`  ${icon} ${file.path}`)
    }
    if (plan.steps.length > 0) {
      lines.push("")
      lines.push("  ─ Steps ─")
      for (const step of plan.steps) {
        lines.push(`  ${step.order}. ${step.description}`)
      }
    }
    if (plan.risks.length > 0) {
      lines.push("")
      lines.push("  ─ Risks ─")
      for (const risk of plan.risks) {
        lines.push(`  ⚠  ${risk}`)
      }
    }
    lines.push("")
    lines.push("─".repeat(60))
    lines.push("  Approve? (Y/n): ")
    return lines.join("\n")
  }

  /** Present a diff summary for user review */
  presentDiff(diff: DiffResult): string {
    const lines: string[] = []
    lines.push("")
    lines.push("═".repeat(60))
    lines.push("  AUTOPILOT — Code Changes")
    lines.push("═".repeat(60))
    lines.push("")
    lines.push(`  ${diff.files.length} file(s) changed`)
    lines.push(`  +${diff.totalInsertions} / -${diff.totalDeletions} lines`)
    lines.push("")

    for (const file of diff.files) {
      const icon = file.type === "added" ? "＋" : file.type === "deleted" ? "−" : "✎"
      lines.push(`  ${icon} ${file.filePath}`)
      lines.push(`     +${file.insertions}  -${file.deletions}`)
      lines.push("")
    }

    lines.push("─".repeat(60))
    lines.push("  Review changes above. Type 'approve' to commit or 'reject <reason>' to regenerate.")
    return lines.join("\n")
  }

  /** Present a status update */
  presentStatus(phase: IterationPhase, message?: string): string {
    const phaseLabels: Record<string, string> = {
      [IterationPhase.Planning]: "📋 Planning...",
      [IterationPhase.AwaitingApproval]: "⏳ Awaiting Approval",
      [IterationPhase.Generating]: "⚡ Generating Code...",
      [IterationPhase.Testing]: "🧪 Running Tests...",
      [IterationPhase.Committing]: "💾 Committing...",
      [IterationPhase.Done]: "✅ Done",
      [IterationPhase.Error]: "❌ Error",
    }

    const label = phaseLabels[phase] || phase
    return message ? `  ${label} — ${message}` : `  ${label}`
  }

  /** Present session list */
  presentSessions(sessions: any[]): string {
    if (sessions.length === 0) return "  No active sessions."

    const lines: string[] = ["", "  Active Sessions:", ""]
    for (const s of sessions) {
      lines.push(`  ${s.id.substring(0, 8)}  ${s.featureDescription.substring(0, 40)}  ${s.status}  ${s.currentPhase}`)
    }
    return lines.join("\n")
  }

  /** Present brief confirmation after approval */
  presentConfirmation(phase: IterationPhase, sessionId?: string): string {
    const lines: string[] = ["", "─".repeat(60)]
    if (phase === IterationPhase.Generating) {
      lines.push("  ✓ Plan approved. Proceeding to code generation...")
    } else if (phase === IterationPhase.Planning) {
      lines.push("  ✓ Regenerating plan with your feedback...")
    } else {
      lines.push(`  ✓ Transitioning to ${phase}...`)
    }
    if (sessionId) {
      lines.push(`  Session: ${sessionId.slice(0, 8)}...`)
    }
    lines.push(`  Time: ${new Date().toISOString()}`)
    lines.push("─".repeat(60))
    return lines.join("\n")
  }

  /** Present timeout warning message */
  presentTimeoutWarning(): string {
    return [
      "",
      "─".repeat(60),
      `  ⏰ Approval timeout (${this.options.timeout}s) reached — auto-rejecting.`,
      "  Use autopilot_reject with feedback or autopilot_approve to respond.",
      "─".repeat(60),
    ].join("\n")
  }
}
