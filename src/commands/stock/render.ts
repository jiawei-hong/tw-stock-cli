import { table } from 'table'

import { color } from '@/constants'
import type { FieldProps } from '@/types/field'
import { TStock } from '@/types/stock'
import {
  addThousandSeparator,
  convertToPercentage,
  shouldConvertToPercentage,
} from '@/utils/stock'
import { getTableHeader, tableConfig } from '@/utils/table'

export function getTrade(stock: TStock | string, fieldCode: string): string {
  const fieldValue = stock[fieldCode as keyof typeof stock]
  if (fieldValue === undefined || fieldValue === null) {
    return '-'
  }
  if (shouldConvertToPercentage(fieldValue)) {
    return addThousandSeparator(convertToPercentage(fieldValue))
  }
  if (fieldCode !== 'c' && /^\d+$/.test(fieldValue)) {
    return addThousandSeparator(fieldValue)
  }
  return fieldValue
}

export function renderStockTable(stocks: TStock[], fields: FieldProps[]): void {
  const tableData: string[][] = [getTableHeader(fields)]

  for (const stock of stocks) {
    const row: string[] = fields.map((field) => {
      const { code, name, callback } = field
      let trade = getTrade(stock, code ?? '')

      if (typeof callback === 'function') {
        trade = callback(stock)
      }
      if (stock.ex === 'otc' && ['漲停', '跌停'].includes(name)) {
        return `${color.rest}-`
      }
      return trade
    })
    tableData.push(row)
  }

  console.log(table(tableData, tableConfig))
}
