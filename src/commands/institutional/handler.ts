import { adaptInstitutionalResponse } from '@/adapters/institutional'
import {
  INSTITUTIONAL_NOT_FOUND,
  INSTITUTIONAL_STOCK_NOT_FOUND,
} from '@/messages/institutional'
import type { FieldProps } from '@/types/field'
import {
  InstitutionalOptionProps,
  InstitutionalOtcResponse,
  InstitutionalStockRow,
  InstitutionalSummaryResponse,
  InstitutionalTseResponse,
} from '@/types/institutional'
import { Category } from '@/types/stock'
import { getFormattedDate } from '@/utils/date'
import { marketDate } from '@/utils/market-date'
import { parseNumber } from '@/utils/number'
import { getTableHeader, responsiveTable } from '@/utils/table'
import { displayFailed } from '@/utils/text'

import { BaseHandler } from '../base-handler'
import { fetchInstitutionalData } from './api'
import Field from './field'
import { getStockUrl, getSummaryUrl } from './url'
import { formatNetValue } from './utils'

class Institutional extends BaseHandler<
  InstitutionalOptionProps,
  InstitutionalStockRow
> {
  private code: string

  constructor(code: string, options: InstitutionalOptionProps) {
    super(options)
    this.code = code
  }

  initialize() {
    if (this.code) {
      this.execute().catch((err) => displayFailed(String(err)))
    } else {
      this.executeSummary().catch((err) => displayFailed(String(err)))
    }
  }

  async executeSummary() {
    const date = getFormattedDate(this.options.date, Category.TSE)
    const url = getSummaryUrl(date)
    const data = await fetchInstitutionalData<InstitutionalSummaryResponse>(url)

    if (!data || data.stat !== 'OK' || !data.data || data.data.length === 0) {
      return displayFailed(INSTITUTIONAL_NOT_FOUND)
    }

    const fields = Field.summary()
    const tableData = [getTableHeader(fields)]

    for (const row of data.data) {
      tableData.push([
        row[0],
        row[1],
        row[2],
        formatNetValue(parseNumber(row[3])),
      ])
    }

    console.log(responsiveTable(tableData, 0))
  }

  protected buildUrl(date: string, category: Category): string {
    return getStockUrl(date, category)
  }

  protected fetchData(url: string): Promise<unknown> {
    return fetchInstitutionalData(url)
  }

  /** The trading date the exchange actually returned (YYYY-MM-DD). */
  private dataDate: string | undefined

  protected parseData(
    data: unknown,
    category: Category
  ): InstitutionalStockRow[] | null {
    // Without --date the exchanges return the latest trading day; remember which.
    this.dataDate = marketDate((data as { date?: unknown } | null)?.date)
    return adaptInstitutionalResponse(
      data as InstitutionalTseResponse | InstitutionalOtcResponse,
      category
    )
  }

  protected getFields(): FieldProps[] {
    return Field.stock()
  }

  protected display(rows: InstitutionalStockRow[]): void {
    if (!this.options.date && this.dataDate) {
      console.log(`資料日期：${this.dataDate}`)
    }
    console.log(
      responsiveTable(
        [
          getTableHeader(this.getFields()),
          ...rows.map((row) => this.formatRow(row)),
        ],
        1
      )
    )
  }

  protected formatRow(row: InstitutionalStockRow): string[] {
    return [
      row.code,
      row.name,
      formatNetValue(row.foreignNet),
      formatNetValue(row.trustNet),
      formatNetValue(row.dealerNet),
      formatNetValue(row.totalNet),
    ]
  }

  protected processRows(
    rows: InstitutionalStockRow[]
  ): InstitutionalStockRow[] {
    return rows.filter((row) => row.code.trim() === this.code.toUpperCase())
  }

  protected getNotFoundMessage(): string {
    if (this.code) {
      return INSTITUTIONAL_STOCK_NOT_FOUND
    }
    return INSTITUTIONAL_NOT_FOUND
  }
}

export default Institutional
