import { table } from 'table'

import type { FieldProps } from '@/types/field'
import { Category } from '@/types/stock'
import { getFormattedDate } from '@/utils/date'
import { getTableHeader, tableConfig } from '@/utils/table'
import { displayFailed } from '@/utils/text'

export interface BaseOptions {
  listed?: Category
  date?: string
}

export abstract class BaseHandler<TOptions extends BaseOptions, TRow> {
  protected options: TOptions

  constructor(options: TOptions) {
    this.options = options
  }

  protected getCategory(): Category {
    return this.options.listed ?? Category.TSE
  }

  protected getDate(category: Category): string {
    return getFormattedDate(this.options.date, category)
  }

  /** Template method — defines the execution skeleton */
  async execute(): Promise<void> {
    const category = this.getCategory()
    const date = this.getDate(category)
    const url = this.buildUrl(date, category)

    if (!url) {
      return displayFailed(this.getNotFoundMessage())
    }

    const data = await this.fetchData(url)
    const rows = this.parseData(data, category)

    if (!rows || rows.length === 0) {
      return displayFailed(this.getNotFoundMessage())
    }

    const processed = this.processRows(rows)

    if (!processed || processed.length === 0) {
      return displayFailed(this.getNotFoundMessage())
    }

    this.display(processed)
  }

  // Abstract methods — subclasses must implement
  protected abstract buildUrl(date: string, category: Category): string
  protected abstract fetchData(url: string): Promise<unknown>
  protected abstract parseData(data: unknown, category: Category): TRow[] | null
  protected abstract getFields(): FieldProps[]
  protected abstract formatRow(row: TRow, index: number): string[]
  protected abstract getNotFoundMessage(): string

  // Hook method — subclasses can override for sorting, filtering, etc.
  protected processRows(rows: TRow[]): TRow[] {
    return rows
  }

  protected display(rows: TRow[]): void {
    const fields = this.getFields()
    const tableData: string[][] = [getTableHeader(fields)]
    rows.forEach((row, index) => {
      tableData.push(this.formatRow(row, index))
    })
    console.log(table(tableData, tableConfig))
  }
}
