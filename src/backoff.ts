/**
 * Retry an async function with exponential backoff and jitter.
 *
 * @param fn - Async function to retry
 * @param options - Configuration options
 * @param options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param options.baseDelayMs - Base delay in milliseconds (default: 1000)
 * @param options.maxDelayMs - Maximum delay cap in milliseconds (default: 30000)
 * @param options.onRetry - Callback invoked before each retry with error, attempt number, and computed delay
 * @returns Result of the function if it succeeds
 * @throws The last error encountered if all retries are exhausted
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    baseDelayMs?: number
    maxDelayMs?: number
    onRetry?: (error: Error, attempt: number, delay: number) => void
  }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3
  const baseDelayMs = options?.baseDelayMs ?? 1000
  const maxDelayMs = options?.maxDelayMs ?? 30000
  const onRetry = options?.onRetry

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxRetries) {
        // Exponential backoff: baseDelayMs * 2^attempt
        const exponentialDelay = baseDelayMs * Math.pow(2, attempt)
        // Jitter: random 0-50% of the exponential delay
        const jitter = Math.random() * 0.5 * exponentialDelay
        const delay = Math.min(exponentialDelay + jitter, maxDelayMs)

        onRetry?.(lastError, attempt + 1, delay)

        await sleep(delay)
      }
    }
  }

  throw lastError!
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
