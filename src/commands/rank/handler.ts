import { adaptRankResponse } from '@/adapters/rank'
import { RANK_NOT_FOUND } from '@/messages/rank'
import type { FieldProps } from '@/types/field'
import {
  RankOptionProps,
  RankOtcResponse,
  RankRow,
  RankTseResponse,
} from '@/types/rank'
import { Category } from '@/types/stock'
import { displayFailed } from '@/utils/text'

import { BaseHandler } from '../base-handler'
import { fetchRankData } from './api'
import Field from './field'
import { getRankUrl } from './url'
import {
  formatPercentage,
  formatPriceChange,
  formatVolume,
  sortRows,
} from './utils'

class Rank extends BaseHandler<RankOptionProps, RankRow> {
  constructor(options: RankOptionProps) {
    super(options)
  }

  initialize() {
    this.execute().catch((err) => displayFailed(String(err)))
  }

  protected buildUrl(date: string, category: Category): string {
    return getRankUrl(date, category)
  }

  protected fetchData(url: string): Promise<unknown> {
    return fetchRankData(url)
  }

  protected parseData(data: unknown, category: Category): RankRow[] | null {
    return adaptRankResponse(
      data as RankTseResponse | RankOtcResponse,
      category
    )
  }

  protected getFields(): FieldProps[] {
    return Field.ranking()
  }

  protected formatRow(row: RankRow, index: number): string[] {
    return [
      String(index + 1),
      row.code,
      row.name,
      row.close.toFixed(2),
      formatPriceChange(row.change),
      formatPercentage(row.changePercent),
      formatVolume(row.volume),
    ]
  }

  protected getNotFoundMessage(): string {
    return RANK_NOT_FOUND
  }

  protected processRows(rows: RankRow[]): RankRow[] {
    const mode = this.options.volume
      ? 'volume'
      : this.options.losers
      ? 'losers'
      : 'gainers'

    const sorted = sortRows(rows, mode)
    const topN = this.options.number ?? 10
    return sorted.slice(0, topN)
  }
}

export default Rank
