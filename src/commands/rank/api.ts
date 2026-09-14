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
  return (
    typeof response.stat === 'string' &&
    Array.isArray(response.tables) &&
    response.tables.every(isRankTable)
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
