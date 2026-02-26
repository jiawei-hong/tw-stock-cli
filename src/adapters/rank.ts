import {
  RankOtcResponse,
  RankRow,
  RankTseResponse,
  RankTseTable,
} from '@/types/rank'
import { Category } from '@/types/stock'
import {
  calculateChangePercent,
  parseNumber,
  parseTseChange,
} from '@/utils/number'

function adaptTseResponse(data: RankTseResponse): RankRow[] | null {
  if (!data || data.stat !== 'OK' || !data.tables) {
    return null
  }

  const stockTable = data.tables.find(
    (t: RankTseTable) => t.title && t.title.includes('每日收盤行情')
  )

  if (!stockTable || !stockTable.data) {
    return null
  }

  return stockTable.data
    .map((row: string[]) => {
      const code = row[0]?.trim()
      const name = row[1]?.trim()
      const close = parseNumber(row[8])
      const change = parseTseChange(row[9], row[10])
      const volume = parseNumber(row[2])

      if (!code || !name || close === 0) return null

      return {
        code,
        name,
        close,
        change,
        changePercent: calculateChangePercent(close, change),
        volume,
      }
    })
    .filter((row: RankRow | null): row is RankRow => row !== null)
}

function adaptOtcResponse(data: RankOtcResponse): RankRow[] | null {
  const stockTable = data?.tables?.[0]
  if (!stockTable || !stockTable.data || stockTable.data.length === 0) {
    return null
  }

  return stockTable.data
    .map((row: string[]) => {
      const code = row[0]?.trim()
      const name = row[1]?.trim()
      const close = parseNumber(row[2])
      const change = parseNumber(row[3])
      const volume = parseNumber(row[8])

      if (!code || !name || close === 0) return null

      return {
        code,
        name,
        close,
        change,
        changePercent: calculateChangePercent(close, change),
        volume,
      }
    })
    .filter((row: RankRow | null): row is RankRow => row !== null)
}

export function adaptRankResponse(
  data: RankTseResponse | RankOtcResponse,
  category: Category
): RankRow[] | null {
  if (category === Category.OTC) {
    return adaptOtcResponse(data as RankOtcResponse)
  }
  return adaptTseResponse(data as RankTseResponse)
}
