import { SOMETHING_WRONG, STOCK_NOT_FOUND } from '@/messages/stock'
import type { FieldProps } from '@/types/field'
import { Category, StockOptionProps, StockResponse } from '@/types/stock'
import { displayFailed } from '@/utils/text'

import { BaseHandler } from '../base-handler'
import { getStock as fetchStockData } from './api'
import Field from './field'
import { getStockWithDate } from './url'
import { getConversionDate, getTaiwanDateFormat, toUppercase } from './utils'

type HistoryRow = string[]

class HistoryStock extends BaseHandler<StockOptionProps, HistoryRow> {
  private code: string
  private parsedDate: string[] = []
  private dateExistDay: boolean = false

  constructor(code: string, options: StockOptionProps) {
    super(options)
    this.code = code
  }

  initialize() {
    if (!this.code) {
      return displayFailed(SOMETHING_WRONG)
    }
    this.execute()
  }

  protected getDate(category: Category): string {
    const specificDate = getConversionDate(
      this.options.date ?? '',
      this.options.listed
    )

    if (!Array.isArray(specificDate)) {
      return ''
    }

    this.parsedDate = specificDate
    this.dateExistDay = this.parsedDate.length === 3

    if (!this.dateExistDay) {
      this.parsedDate.push('01')
    }

    const separator = category === Category.OTC ? '/' : ''
    return this.parsedDate.join(separator)
  }

  protected buildUrl(date: string, category: Category): string {
    if (!date) return ''
    return getStockWithDate(toUppercase(this.code), date, category)
  }

  protected fetchData(url: string): Promise<unknown> {
    return fetchStockData(url)
  }

  protected parseData(data: unknown): HistoryRow[] | null {
    const response = data as StockResponse
    const dataField = ['data', 'aaData']
    const getDataKey = Object.keys(response).find((key) =>
      dataField.includes(key)
    )

    if ('stat' in response && response['stat'] != 'OK') {
      return null
    }

    if (!getDataKey) {
      return null
    }

    return response[getDataKey as keyof typeof response] as HistoryRow[]
  }

  protected getFields(): FieldProps[] {
    return Field.history()
  }

  protected formatRow(row: HistoryRow): string[] {
    return row.slice(0, 9)
  }

  protected getNotFoundMessage(): string {
    return STOCK_NOT_FOUND
  }

  protected processRows(rows: HistoryRow[]): HistoryRow[] {
    if (this.dateExistDay) {
      const taiwanDate = getTaiwanDateFormat(this.parsedDate.slice(0, 3))
      return rows.filter((row) => row[0] === taiwanDate)
    }
    return rows
  }
}

export default HistoryStock
