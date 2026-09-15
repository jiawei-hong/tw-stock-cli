import { setTimeout as delay } from 'node:timers/promises'

const DEFAULT_TIMEOUT_MS = 15_000
const DEFAULT_MAX_RETRIES = 2
const MAX_ALLOWED_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 250
const MAX_RETRY_DELAY_MS = 2_000

export type RequestJsonOptions = {
  timeoutMs?: number
  maxRetries?: number
  retryDelayMs?: number
  sleep?: (delayMs: number) => Promise<void>
  signal?: AbortSignal
}

class HttpStatusError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpStatusError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getRequestContext(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.hostname}${parsed.pathname}`
  } catch {
    return url
  }
}

function isTimeoutError(error: unknown, signal: AbortSignal): boolean {
  if (signal.aborted) return true
  if (!isRecord(error) || typeof error.name !== 'string') return false
  return error.name === 'AbortError' || error.name === 'TimeoutError'
}

function shouldRetry(
  error: unknown,
  signal: AbortSignal,
  responseReceived: boolean
): boolean {
  if (error instanceof HttpStatusError) {
    return error.status === 429 || error.status >= 500
  }
  if (isTimeoutError(error, signal)) return true

  return !responseReceived
}

function normalizeRetries(maxRetries: number | undefined): number {
  if (maxRetries === undefined) return DEFAULT_MAX_RETRIES
  if (!Number.isFinite(maxRetries)) return DEFAULT_MAX_RETRIES
  return Math.min(MAX_ALLOWED_RETRIES, Math.max(0, Math.floor(maxRetries)))
}

function normalizeTimeout(timeoutMs: number | undefined): number {
  if (timeoutMs === undefined) return DEFAULT_TIMEOUT_MS
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return DEFAULT_TIMEOUT_MS
  return Math.floor(timeoutMs)
}

function normalizeRetryDelay(retryDelayMs: number | undefined): number {
  if (retryDelayMs === undefined) return DEFAULT_RETRY_DELAY_MS
  if (!Number.isFinite(retryDelayMs) || retryDelayMs < 0) {
    return DEFAULT_RETRY_DELAY_MS
  }
  return Math.min(MAX_RETRY_DELAY_MS, retryDelayMs)
}

export async function requestJson<T>(
  url: string,
  options: RequestJsonOptions = {}
): Promise<T> {
  const maxRetries = normalizeRetries(options.maxRetries)
  const timeoutMs = normalizeTimeout(options.timeoutMs)
  const retryDelayMs = normalizeRetryDelay(options.retryDelayMs)
  const sleep =
    options.sleep ??
    ((delayMs: number) => delay(delayMs, undefined, { signal: options.signal }))
  let lastError: unknown

  for (let retry = 0; retry <= maxRetries; retry += 1) {
    options.signal?.throwIfAborted()
    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal
    let responseReceived = false

    try {
      const response = await fetch(url, { signal })
      responseReceived = true
      if (!response.ok) throw new HttpStatusError(response.status)

      const data = await response.json()
      if (isRecord(data) && 'rtcode' in data && data.rtcode !== '0000') {
        throw new Error(
          `Upstream error ${data.rtcode}: ${data.rtmessage ?? 'unknown'}`
        )
      }
      return data as T
    } catch (error) {
      options.signal?.throwIfAborted()
      lastError = error
      if (
        retry === maxRetries ||
        !shouldRetry(error, signal, responseReceived)
      ) {
        throw new Error(
          `Request failed for ${getRequestContext(url)} after ${
            retry + 1
          } attempt${retry === 0 ? '' : 's'}: ${getErrorMessage(error)}`,
          { cause: error }
        )
      }

      const delay = Math.min(retryDelayMs * 2 ** retry, MAX_RETRY_DELAY_MS)
      if (delay > 0) await sleep(delay)
    }
  }

  throw new Error(
    `Request failed for ${getRequestContext(url)}: ${getErrorMessage(
      lastError
    )}`
  )
}
