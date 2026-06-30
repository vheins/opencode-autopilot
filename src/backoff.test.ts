import { describe, it, expect, vi, afterEach } from "vitest"
import { retryWithBackoff } from "./backoff.js"

afterEach(() => {
  vi.useRealTimers()
})

describe("retryWithBackoff", () => {
  it("should retry on failure and eventually succeed", async () => {
    let callCount = 0
    const fn = vi.fn(async () => {
      callCount++
      if (callCount < 3) throw new Error(`Attempt ${callCount} failed`)
      return "success"
    })

    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelayMs: 10,
      maxDelayMs: 100,
    })

    expect(result).toBe("success")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("should succeed on first attempt without retry", async () => {
    const fn = vi.fn(async () => "immediate success")

    const result = await retryWithBackoff(fn, { maxRetries: 3 })

    expect(result).toBe("immediate success")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("should exhaust retries and throw the last error", async () => {
    const fn = vi.fn(async () => {
      throw new Error("persistent failure")
    })

    await expect(
      retryWithBackoff(fn, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100 })
    ).rejects.toThrow("persistent failure")

    // 1 initial + 2 retries = 3 total calls
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("should have exponential delay increases", async () => {
    vi.useFakeTimers()

    const delays: number[] = []
    const fn = vi.fn(async () => {
      throw new Error("fail")
    })

    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 10000,
      onRetry: (_error, _attempt, delay) => {
        delays.push(delay)
      },
    })

    // Run through the retries by advancing timers
    // Base: 100*2^0=100, 100*2^1=200, 100*2^2=400 — plus jitter (0-50%)
    // We advance enough time for all retries
    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(5000)
    }

    await expect(promise).rejects.toThrow("fail")

    // We should have 3 delays logged (attempts 1, 2, 3)
    expect(delays).toHaveLength(3)

    // Each delay should be >= the exponential base (without jitter floor)
    expect(delays[0]).toBeGreaterThanOrEqual(100)   // 100 * 2^0
    expect(delays[1]).toBeGreaterThanOrEqual(200)   // 100 * 2^1
    expect(delays[2]).toBeGreaterThanOrEqual(400)   // 100 * 2^2

    // Each delay should be <= exponential + 50% jitter = base * 2^attempt * 1.5
    expect(delays[0]).toBeLessThanOrEqual(150)      // 100 * 1.5
    expect(delays[1]).toBeLessThanOrEqual(300)      // 200 * 1.5
    expect(delays[2]).toBeLessThanOrEqual(600)      // 400 * 1.5
  })

  it("should cap delay at maxDelayMs", async () => {
    vi.useFakeTimers()

    const delays: number[] = []
    const fn = vi.fn(async () => {
      throw new Error("fail")
    })

    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelayMs: 100000, // very large base — delay will exceed maxDelayMs
      maxDelayMs: 500,
      onRetry: (_error, _attempt, delay) => {
        delays.push(delay)
      },
    })

    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(5000)
    }

    await expect(promise).rejects.toThrow("fail")

    expect(delays).toHaveLength(3)
    for (const d of delays) {
      expect(d).toBeLessThanOrEqual(500) // capped at maxDelayMs
    }
  })

  it("should call onRetry with correct error, attempt, and delay", async () => {
    vi.useFakeTimers()

    const onRetry = vi.fn()
    const testError = new Error("retryable error")
    let callCount = 0

    const fn = vi.fn(async () => {
      callCount++
      throw testError
    })

    const promise = retryWithBackoff(fn, {
      maxRetries: 2,
      baseDelayMs: 100,
      maxDelayMs: 10000,
      onRetry,
    })

    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(5000)
    }

    await expect(promise).rejects.toThrow("retryable error")

    // onRetry should be called for each retry (maxRetries times)
    expect(onRetry).toHaveBeenCalledTimes(2)
    expect(onRetry).toHaveBeenNthCalledWith(1, testError, 1, expect.any(Number))
    expect(onRetry).toHaveBeenNthCalledWith(2, testError, 2, expect.any(Number))
  })

  it("should use default options when not provided", async () => {
    const fn = vi.fn(async () => {
      throw new Error("fail")
    })

    // Default: maxRetries=3, so 4 total calls (1 initial + 3 retries)
    // With fake timers we fast-forward through the delays
    vi.useFakeTimers()

    const promise = retryWithBackoff(fn)

    // Default maxDelayMs=30000, baseDelayMs=1000
    // Delays: 1000, 2000, 4000 (+ jitter) < 30000
    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(50000)
    }

    await expect(promise).rejects.toThrow("fail")
    expect(fn).toHaveBeenCalledTimes(4) // 1 initial + 3 default retries
  })

  it("should handle non-Error thrown values", async () => {
    let callCount = 0
    const fn = vi.fn(async () => {
      callCount++
      if (callCount < 2) throw "string error" // eslint-disable-line no-throw-literal
      return "recovered"
    })

    vi.useFakeTimers()

    const promise = retryWithBackoff(fn, {
      maxRetries: 2,
      baseDelayMs: 10,
      maxDelayMs: 100,
    })

    for (let i = 0; i < 10; i++) {
      await vi.advanceTimersByTimeAsync(1000)
    }

    await expect(promise).resolves.toBe("recovered")
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("should pass through successful result type", async () => {
    const fn = vi.fn(async (): Promise<number> => 42)
    const result = await retryWithBackoff(fn)
    expect(result).toBe(42)
  })
})
