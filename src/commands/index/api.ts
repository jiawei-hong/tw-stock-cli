import { generateOHLCURL } from '@/commands/stock/url'
import { type RequestJsonOptions, requestJson } from '@/utils/http'

type OHLCRow = {
  c: string
  ts: string
}

function isOHLCRow(value: unknown): value is OHLCRow {
  if (typeof value !== 'object' || value === null) return false
  const row = value as Record<string, unknown>
  return typeof row.c === 'string' && typeof row.ts === 'string'
}

export const getOHLC = (type: string, options?: RequestJsonOptions) =>
  requestJson<unknown>(generateOHLCURL(type), options).then((data) => {
    if (
      typeof data !== 'object' ||
      data === null ||
      !Array.isArray((data as { ohlcArray?: unknown }).ohlcArray) ||
      !(data as { ohlcArray: unknown[] }).ohlcArray.every(isOHLCRow)
    ) {
      throw new Error('Invalid OHLC response payload')
    }
    return (data as { ohlcArray: OHLCRow[] }).ohlcArray
  })
