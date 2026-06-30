import { spawn, type ChildProcess } from "child_process"
import { randomUUID } from "crypto"

interface MCPResponse {
  id: string
  result?: any
  error?: { code: number; message: string }
}

export class MCPClient {
  private process: ChildProcess | null = null
  private pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }>()
  private buffer = ""

  async connect(command: string, args: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env },
      })

      this.process.stdout?.on("data", (data: Buffer) => {
        this.buffer += data.toString()
        this.processBuffer()
      })

      this.process.on("error", reject)
      this.process.on("spawn", () => resolve())
    })
  }

  private processBuffer() {
    const lines = this.buffer.split("\n")
    this.buffer = lines.pop() || ""
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const msg: MCPResponse = JSON.parse(line)
        const pending = this.pending.get(msg.id)
        if (pending) {
          if (msg.error) pending.reject(new Error(msg.error.message))
          else pending.resolve(msg.result)
          this.pending.delete(msg.id)
        }
      } catch { /* incomplete JSON */ }
    }
  }

  async call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = randomUUID()
      this.pending.set(id, { resolve, reject })
      const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params })
      this.process?.stdin?.write(msg + "\n")
    })
  }

  // Convenience methods
  async createSessionTask(description: string, projectPath: string, taskCode: string, status: string = "active") {
    return this.call("task-create", {
      owner: "vheins",
      repo: "opencode-autopilot",
      task_code: taskCode,
      phase: status,
      title: description,
      description: `### AUTOPILOT Session\n- **Project**: ${projectPath}\n- **Feature**: ${description}\n- **Status**: ${status}`,
      status: "in_progress",
      priority: 3,
      tags: ["autopilot-session"],
    })
  }

  async updateSessionTask(taskCode: string, updates: { status?: string; phase?: string; description?: string }) {
    return this.call("task-update", {
      owner: "vheins",
      repo: "opencode-autopilot",
      task_code: taskCode,
      ...updates,
    })
  }

  async listSessionTasks(tag: string = "autopilot-session") {
    return this.call("task-list", {
      owner: "vheins",
      repo: "opencode-autopilot",
      status: "in_progress,pending,backlog",
      query: tag,
    })
  }

  async storeMemory(title: string, content: string, tags: string[] = []) {
    return this.call("memory-store", {
      type: "code_fact",
      title,
      content,
      importance: 3,
      scope: { owner: "vheins", repo: "opencode-autopilot" },
      tags,
    })
  }

  async searchMemory(query: string, tags?: string[]): Promise<any> {
    return this.call("memory-search", {
      owner: "vheins",
      repo: "opencode-autopilot",
      query,
      tags,
      limit: 100,
    })
  }

  async getMemoryDetail(id: string): Promise<any> {
    return this.call("memory-detail", { id })
  }

  async getTask(taskCode: string): Promise<any> {
    return this.call("task-detail", {
      owner: "vheins",
      repo: "opencode-autopilot",
      task_code: taskCode,
    })
  }

  async disconnect() {
    this.process?.kill()
    this.process = null
  }
}
