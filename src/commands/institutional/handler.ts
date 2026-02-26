import { table } from 'table'

import { adaptInstitutionalResponse } from '@/adapters/institutional'
import {
  INSTITUTIONAL_NOT_FOUND,
  INSTITUTIONAL_STOCK_NOT_FOUND,
} from '@/messages/institutional'
import type { FieldProps } from '@/types/field'
import {
  InstitutionalOptionProps,
  InstitutionalStockRow,
  InstitutionalSummaryResponse,
} from '@/types/institutional'
import { Category } from '@/types/stock'
import { getFormattedDate } from '@/utils/date'
import { parseNumber } from '@/utils/number'
import { getTableHeader, tableConfig } from '@/utils/table'
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
      this.execute()
    } else {
      this.executeSummary()
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

    console.log(table(tableData, tableConfig))
  }

  protected buildUrl(date: string, category: Category): string {
    return getStockUrl(date, category)
  }

  protected fetchData(url: string): Promise<unknown> {
    return fetchInstitutionalData(url)
  }

  protected parseData(
    data: unknown,
    category: Category
  ): InstitutionalStockRow[] | null {
    return adaptInstitutionalResponse(data as any, category)
  }

  protected getFields(): FieldProps[] {
    return Field.stock()
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

  protected getNotFoundMessage(): string {
    return INSTITUTIONAL_NOT_FOUND
  }

  protected processRows(
    rows: InstitutionalStockRow[]
  ): InstitutionalStockRow[] {
    const filtered = rows.filter(
      (row) => row.code.trim() === this.code.toUpperCase()
    )

    if (filtered.length === 0) {
      displayFailed(INSTITUTIONAL_STOCK_NOT_FOUND)
      return []
    }

    return filtered
  }
}

export default Institutional
