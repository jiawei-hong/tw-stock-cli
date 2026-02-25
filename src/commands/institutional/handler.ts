import { table } from 'table'

import {
  INSTITUTIONAL_NOT_FOUND,
  INSTITUTIONAL_STOCK_NOT_FOUND,
} from '@/messages/institutional'
import {
  InstitutionalOptionProps,
  InstitutionalOtcResponse,
  InstitutionalStockRow,
  InstitutionalSummaryResponse,
  InstitutionalTseResponse,
} from '@/types/institutional'
import { Category } from '@/types/stock'
import { getFormattedDate } from '@/utils/date'
import { parseNumber } from '@/utils/number'
import { getTableHeader, tableConfig } from '@/utils/table'
import { displayFailed } from '@/utils/text'

import { fetchInstitutionalData } from './api'
import Field from './field'
import { getStockUrl, getSummaryUrl } from './url'
import { formatNetValue } from './utils'

interface Institutional {
  code: string
  options: InstitutionalOptionProps
}

class Institutional {
  constructor(code: string, options: InstitutionalOptionProps) {
    this.code = code
    this.options = options
  }

  initialize() {
    if (this.code) {
      this.executeStock()
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

  async executeStock() {
    const category = this.options.listed ?? Category.TSE
    const date = getFormattedDate(this.options.date, category)
    const url = getStockUrl(date, category)
    const data = await fetchInstitutionalData(url)

    const rows = this.parseStockData(data, category)

    if (!rows || rows.length === 0) {
      return displayFailed(INSTITUTIONAL_NOT_FOUND)
    }

    const filtered = rows.filter(
      (row) => row.code.trim() === this.code.toUpperCase()
    )

    if (filtered.length === 0) {
      return displayFailed(INSTITUTIONAL_STOCK_NOT_FOUND)
    }

    this.displayStockTable(filtered)
  }

  parseStockData(
    data: InstitutionalTseResponse | InstitutionalOtcResponse,
    category: Category
  ): InstitutionalStockRow[] | null {
    if (category === Category.OTC) {
      return this.parseOtcData(data as InstitutionalOtcResponse)
    }
    return this.parseTseData(data as InstitutionalTseResponse)
  }

  parseTseData(data: InstitutionalTseResponse): InstitutionalStockRow[] | null {
    if (!data || data.stat !== 'OK' || !data.data || data.data.length === 0) {
      return null
    }

    return data.data.map((row: string[]) => ({
      code: row[0].trim(),
      name: row[1].trim(),
      foreignBuy: parseNumber(row[2]),
      foreignSell: parseNumber(row[3]),
      foreignNet: parseNumber(row[4]),
      trustBuy: parseNumber(row[5]),
      trustSell: parseNumber(row[6]),
      trustNet: parseNumber(row[7]),
      dealerNet: parseNumber(row[8]),
      totalNet: parseNumber(row[11]),
    }))
  }

  parseOtcData(data: InstitutionalOtcResponse): InstitutionalStockRow[] | null {
    if (!data || !data.aaData || data.aaData.length === 0) {
      return null
    }

    return data.aaData.map((row: string[]) => ({
      code: row[0].trim(),
      name: row[1].trim(),
      foreignBuy: parseNumber(row[2]),
      foreignSell: parseNumber(row[3]),
      foreignNet: parseNumber(row[4]),
      trustBuy: parseNumber(row[5]),
      trustSell: parseNumber(row[6]),
      trustNet: parseNumber(row[7]),
      dealerNet: parseNumber(row[8]),
      totalNet: parseNumber(row[11]),
    }))
  }

  displayStockTable(rows: InstitutionalStockRow[]) {
    const fields = Field.stock()
    const tableData = [getTableHeader(fields)]

    for (const row of rows) {
      tableData.push([
        row.code,
        row.name,
        formatNetValue(row.foreignNet),
        formatNetValue(row.trustNet),
        formatNetValue(row.dealerNet),
        formatNetValue(row.totalNet),
      ])
    }

    console.log(table(tableData, tableConfig))
  }
}

export default Institutional
