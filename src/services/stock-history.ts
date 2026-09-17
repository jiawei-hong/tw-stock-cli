import { getStockWithDate } from '@/commands/stock/url'
import { Category } from '@/types/stock'
import { requestJson } from '@/utils/http'
import { marketDate, strictNumber, taipeiToday } from '@/utils/market-date'

export type HistoryPoint = { date: string; close: number }
export type HistoryWindow = { start: string; end: string; months: string[] }

export function historyWindow(
  range = '1m',
  month?: string,
  now = new Date()
): HistoryWindow {
  const counts: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }
  if (!Object.hasOwn(counts, range))
    throw new Error('--range must be 1m, 3m, 6m, or 1y')
  let start: string
  let end: string
  if (month !== undefined) {
    if (!/^(?:19|20)\d{2}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error('--chart --date must use YYYY-MM format')
    }
    start = `${month}-01`
    end = new Date(
      Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)
    )
      .toISOString()
      .slice(0, 10)
  } else {
    end = taipeiToday(now)
    const [year, monthNumber, day] = end.split('-').map(Number)
    const first = new Date(Date.UTC(year, monthNumber - 1 - counts[range], 1))
    const lastDay = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)
    ).getUTCDate()
    first.setUTCDate(Math.min(day, lastDay))
    start = first.toISOString().slice(0, 10)
  }
  const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00Z`)
  const months: string[] = []
  while (cursor.toISOString().slice(0, 7) <= end.slice(0, 7)) {
    months.push(cursor.toISOString().slice(0, 7))
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  return { start, end, months }
}

export function historyUrl(
  code: string,
  month: string,
  market: Category
): string {
  if (market === Category.OTC) {
    const query = new URLSearchParams({
      code,
      date: `${month.replace('-', '/')}/01`,
      response: 'json',
    })
    return `https://www.tpex.org.tw/www/zh-tw/afterTrading/tradingStock?${query}`
  }
  return getStockWithDate(code, `${month.replace('-', '')}01`, market)
}

export function parseHistory(data: unknown, month: string): HistoryPoint[] {
  if (!data || typeof data !== 'object')
    throw new Error('Invalid history response')
  const response = data as {
    stat?: unknown
    data?: unknown
    tables?: { data?: unknown }[]
  }
  if (typeof response.stat !== 'string')
    throw new Error('Invalid history status')
  if (response.stat.toLowerCase() !== 'ok') {
    if (response.stat.includes('沒有符合條件')) return []
    throw new Error(`History unavailable: ${response.stat}`)
  }
  const rows = response.data ?? response.tables?.[0]?.data
  if (!Array.isArray(rows)) throw new Error('Invalid history rows')
  const points: HistoryPoint[] = []
  for (const row of rows) {
    if (!Array.isArray(row)) throw new Error('Invalid history row')
    const date = marketDate(row[0])
    if (!date || !date.startsWith(month))
      throw new Error('History response has an unexpected date')
    const close = strictNumber(row[6])
    if (close !== undefined && close > 0) points.push({ date, close })
  }
  return points
}

export async function loadHistory(
  code: string,
  market: Category,
  window: HistoryWindow
): Promise<HistoryPoint[]> {
  const points = new Map<string, HistoryPoint>()
  // Request months sequentially to avoid a burst against the exchange.
  for (const month of window.months) {
    try {
      const response = await requestJson<unknown>(
        historyUrl(code, month, market)
      )
      for (const point of parseHistory(response, month)) {
        if (point.date >= window.start && point.date <= window.end)
          points.set(point.date, point)
      }
    } catch (error) {
      throw new Error(`Cannot load history for ${month}: ${String(error)}`)
    }
  }
  return [...points.values()].sort((left, right) =>
    left.date.localeCompare(right.date)
  )
}
