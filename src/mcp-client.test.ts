import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventEmitter } from "events"

// Fixed UUID for predictable testing
vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "fixed-test-uuid"),
}))

// Track the spawned process for test control
let mockProcess: any

vi.mock("child_process", () => ({
  spawn: vi.fn(() => {
    mockProcess = new EventEmitter()
    mockProcess.stdout = new EventEmitter()
    mockProcess.stderr = new EventEmitter()
    mockProcess.stdin = { write: vi.fn() }
    mockProcess.kill = vi.fn()
    mockProcess.pid = 12345
    return mockProcess
  }),
}))

import { MCPClient } from "./mcp-client.js"

/** Helper: connect the client and emit spawn so the promise resolves */
async function connectClient(client: MCPClient, command = "npx", args: string[] = []): Promise<void> {
  const connectPromise = client.connect(command, args)
  // At this point spawn() has been called synchronously inside the connect Promise executor,
  // so mockProcess is already defined.
  mockProcess.emit("spawn")
  await connectPromise
}

describe("MCPClient", () => {
  let client: MCPClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new MCPClient()
    mockProcess = undefined
  })

  describe("connect", () => {
    it("should resolve on spawn event", async () => {
      const connectPromise = client.connect("npx", ["-y", "test-mcp"])
      mockProcess.emit("spawn")
      await connectPromise

      const { spawn } = await import("child_process")
      expect(spawn).toHaveBeenCalledWith("npx", ["-y", "test-mcp"], {
        stdio: ["pipe", "pipe", "pipe"],
        env: { ...process.env },
      })
    })

    it("should reject on error event", async () => {
      const connectPromise = client.connect("npx", ["bad-command"])
      mockProcess.emit("error", new Error("spawn error"))
      await expect(connectPromise).rejects.toThrow("spawn error")
    })
  })

  describe("call", () => {
    it("should call a method and resolve with result", async () => {
      await connectClient(client)

      // Start call
      const callPromise = client.call("test-method", { param1: "value1" })

      // Simulate stdout response — must include trailing newline for processBuffer
      const response = JSON.stringify({
        jsonrpc: "2.0",
        id: "fixed-test-uuid",
        result: { data: "success" },
      }) + "\n"
      mockProcess.stdout.emit("data", Buffer.from(response))

      const result = await callPromise
      expect(result).toEqual({ data: "success" })

      // Verify stdin write
      expect(mockProcess.stdin.write).toHaveBeenCalledWith(
        JSON.stringify({
          jsonrpc: "2.0",
          id: "fixed-test-uuid",
          method: "test-method",
          params: { param1: "value1" },
        }) + "\n",
      )
    })

    it("should reject on error response", async () => {
      await connectClient(client)

      const callPromise = client.call("failing-method")

      const response = JSON.stringify({
        jsonrpc: "2.0",
        id: "fixed-test-uuid",
        error: { code: -1, message: "Method not found" },
      }) + "\n"
      mockProcess.stdout.emit("data", Buffer.from(response))

      await expect(callPromise).rejects.toThrow("Method not found")
    })
  })

  describe("convenience methods", () => {
    beforeEach(async () => {
      await connectClient(client)
      // Ensure every call resolves immediately by auto-responding on stdin write
      mockProcess.stdin.write = vi.fn(() => {
        const response = JSON.stringify({
          jsonrpc: "2.0",
          id: "fixed-test-uuid",
          result: { success: true },
        }) + "\n"
        process.nextTick(() => {
          mockProcess.stdout.emit("data", Buffer.from(response))
        })
      })
    })

    it("createSessionTask should call task-create", async () => {
      const result = await client.createSessionTask("Test feature", "/test/project", "TASK-001", "active")
      expect(result).toEqual({ success: true })
    })

    it("updateSessionTask should call task-update", async () => {
      const result = await client.updateSessionTask("TASK-001", { status: "completed" })
      expect(result).toEqual({ success: true })
    })

    it("listSessionTasks should call task-list", async () => {
      const result = await client.listSessionTasks("autopilot-session")
      expect(result).toEqual({ success: true })
    })

    it("storeMemory should call memory-store", async () => {
      const result = await client.storeMemory("Test Memory", "content here", ["tag1"])
      expect(result).toEqual({ success: true })
    })

    it("searchMemory should call memory-search", async () => {
      const result = await client.searchMemory("query", ["tag1"])
      expect(result).toEqual({ success: true })
    })

    it("getMemoryDetail should call memory-detail", async () => {
      const result = await client.getMemoryDetail("mem-id")
      expect(result).toEqual({ success: true })
    })

    it("getTask should call task-detail", async () => {
      const result = await client.getTask("TASK-001")
      expect(result).toEqual({ success: true })
    })

    it("listSessionTasks should use default tag", async () => {
      const result = await client.listSessionTasks()
      expect(result).toEqual({ success: true })
    })

    it("storeMemory should use default empty tags", async () => {
      const result = await client.storeMemory("Test", "content")
      expect(result).toEqual({ success: true })
    })
  })

  describe("disconnect", () => {
    it("should kill the process", async () => {
      await connectClient(client)

      client.disconnect()
      expect(mockProcess.kill).toHaveBeenCalled()
    })

    it("should be safe to call when not connected", () => {
      client.disconnect()
    })

    it("should clear process reference", async () => {
      await connectClient(client)

      client.disconnect()
      expect(client["process"]).toBeNull()
    })
  })

  describe("buffer processing", () => {
    it("should handle chunked JSON data across multiple data events", async () => {
      await connectClient(client)

      // First chunk: incomplete JSON without trailing newline — goes to buffer
      mockProcess.stdout.emit("data", Buffer.from('{"jsonrpc": "2.0",'))

      // Second chunk completes the line — buffer reconstructs and processes
      const callPromise = client.call("test")
      mockProcess.stdout.emit(
        "data",
        Buffer.from(' "id": "fixed-test-uuid", "result": "done"}\n'),
      )

      const result = await callPromise
      expect(result).toBe("done")
    })

    it("should skip empty lines in data stream", async () => {
      await connectClient(client)

      const callPromise = client.call("test")
      mockProcess.stdout.emit("data", Buffer.from("\n\n"))
      mockProcess.stdout.emit(
        "data",
        Buffer.from(
          JSON.stringify({ jsonrpc: "2.0", id: "fixed-test-uuid", result: "ok" }) + "\n",
        ),
      )

      const result = await callPromise
      expect(result).toBe("ok")
    })
  })
})
