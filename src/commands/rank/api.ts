import { RankOtcResponse, RankTseResponse } from '@/types/rank'
import { type RequestJsonOptions, requestJson } from '@/utils/http'

function isRankTable(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const table = value as { data?: unknown }
  return Array.isArray(table.data)
}

function isRankResponse(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const response = value as { stat?: unknown; tables?: unknown }
  if (typeof response.stat !== 'string') return false
  // No trading data: TWSE answers {"stat":"很抱歉，沒有符合條件的資料!"} without
  // tables. Let the adapter report "not found" instead of a payload error.
  if (response.stat.toLowerCase() !== 'ok') return response.tables === undefined
  // TWSE MI_INDEX ends with an empty {} table, so require at least one table
  // with data rather than every table. An empty list simply has no rows.
  return (
    Array.isArray(response.tables) &&
    (response.tables.length === 0 || response.tables.some(isRankTable))
  )
}

function fetchRankData<T extends RankTseResponse | RankOtcResponse>(
  url: string,
  options?: RequestJsonOptions
): Promise<T> {
  return requestJson<unknown>(url, options).then((data) => {
    if (!isRankResponse(data)) throw new Error('Invalid rank response payload')
    return data as T
  })
}

export { fetchRankData }
