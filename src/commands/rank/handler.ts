import { table } from 'table'

import { RANK_NOT_FOUND } from '@/messages/rank'
import {
  RankOptionProps,
  RankOtcResponse,
  RankRow,
  RankTseResponse,
  RankTseTable,
} from '@/types/rank'
import { Category } from '@/types/stock'
import { getFormattedDate } from '@/utils/date'
import { parseNumber } from '@/utils/number'
import { getTableHeader, tableConfig } from '@/utils/table'
import { displayFailed } from '@/utils/text'

import { fetchRankData } from './api'
import Field from './field'
import { getRankUrl } from './url'
import {
  calculateChangePercent,
  formatPercentage,
  formatPriceChange,
  formatVolume,
  parseTseChange,
  sortRows,
} from './utils'

interface Rank {
  options: RankOptionProps
}

class Rank {
  constructor(options: RankOptionProps) {
    this.options = options
  }

  initialize() {
    this.execute()
  }

  async execute() {
    const category = this.options.listed ?? Category.TSE
    const date = getFormattedDate(this.options.date, category)
    const url = getRankUrl(date, category)
    const data = await fetchRankData(url)

    const rows = this.extractRows(data, category)

    if (!rows || rows.length === 0) {
      return displayFailed(RANK_NOT_FOUND)
    }

    const mode = this.options.volume
      ? 'volume'
      : this.options.losers
      ? 'losers'
      : 'gainers'

    const sorted = sortRows(rows, mode)
    const topN = this.options.number ?? 10
    const sliced = sorted.slice(0, topN)

    this.displayRanking(sliced)
  }

  extractRows(
    data: RankTseResponse | RankOtcResponse,
    category: Category
  ): RankRow[] | null {
    if (category === Category.OTC) {
      return this.extractOtcRows(data as RankOtcResponse)
    }
    return this.extractTseRows(data as RankTseResponse)
  }

  extractTseRows(data: RankTseResponse): RankRow[] | null {
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

  extractOtcRows(data: RankOtcResponse): RankRow[] | null {
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

  displayRanking(rows: RankRow[]) {
    const fields = Field.ranking()
    const tableData = [getTableHeader(fields)]

    rows.forEach((row, index) => {
      tableData.push([
        String(index + 1),
        row.code,
        row.name,
        row.close.toFixed(2),
        formatPriceChange(row.change),
        formatPercentage(row.changePercent),
        formatVolume(row.volume),
      ])
    })

    console.log(table(tableData, tableConfig))
  }
}

export default Rank
