import stringWidth from 'string-width'
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

import { quoteStatus, quoteTimestamp } from './quote-status'

function renderCompactQuotes(stocks: TStock[], width: number): string {
  const rows = stocks.map((stock) => [
    stock.c,
    stock.n || '-',
    getTrade(stock, 'z'),
    quoteStatus(stock),
  ])
  if (width < 60) {
    return stocks
      .map((stock, index) =>
        table(
          [
            [`代號: ${rows[index][0]}`],
            [`公司: ${rows[index][1]}`],
            [`成交價: ${rows[index][2]}`],
            [`報價狀態: ${rows[index][3]}`],
            [`成交時間 (台北): ${quoteTimestamp(stock)}`],
          ],
          {
            ...tableConfig,
            columnDefault: { width: Math.max(2, width - 4), alignment: 'left' },
          }
        )
      )
      .join('\n')
  }
  const contentWidth = width - 13
  const codeWidth = 8
  const priceWidth = 14
  const statusWidth = 10
  const output = table([['代號', '公司', '成交價', '報價狀態'], ...rows], {
    ...tableConfig,
    columns: {
      0: { width: codeWidth },
      1: {
        width: contentWidth - codeWidth - priceWidth - statusWidth,
        alignment: 'left',
      },
      2: { width: priceWidth, alignment: 'right' },
      3: { width: statusWidth },
    },
  })
  const timestamps = table(
    [
      ['成交時間 (台北)'],
      ...stocks.map((stock) => [`${stock.c}: ${quoteTimestamp(stock)}`]),
    ],
    {
      ...tableConfig,
      columnDefault: { width: width - 4, alignment: 'left' },
    }
  )
  return `${output}\n${timestamps}`
}

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

  const output = table(tableData, tableConfig)
  const width = process.stdout.columns
  const overflows =
    Number.isFinite(width) &&
    width >= 6 &&
    output.split('\n').some((line) => stringWidth(line) > width)
  console.log(overflows ? renderCompactQuotes(stocks, width) : output)
}
