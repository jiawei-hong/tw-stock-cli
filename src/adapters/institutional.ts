import {
  InstitutionalOtcResponse,
  InstitutionalStockRow,
  InstitutionalTseResponse,
} from '@/types/institutional'
import { Category } from '@/types/stock'
import { parseNumber } from '@/utils/number'

type Column = Exclude<keyof InstitutionalStockRow, 'code' | 'name'>

/**
 * Column indexes per exchange, verified against live responses for
 * 2026-11-13. Each value lists the columns summed into that field, so foreign
 * figures include foreign dealers and total = foreign + trust + dealer.
 */
const LAYOUTS: Record<Category, Record<Column, number[]>> = {
  // TWSE T86: 代號, 名稱, 外陸資(不含外資自營商) 買/賣/超 2-4, 外資自營商 5-7,
  // 投信 8-10, 自營商買賣超 11, 自營商(自行買賣) 12-14, 自營商(避險) 15-17, 三大法人 18
  [Category.TSE]: {
    foreignBuy: [2, 5],
    foreignSell: [3, 6],
    foreignNet: [4, 7],
    trustBuy: [8],
    trustSell: [9],
    trustNet: [10],
    dealerNet: [11],
    totalNet: [18],
  },
  // TPEx 3itrade_hedge_result: 代號, 名稱, 外資(不含自營) 2-4, 外資自營商 5-7,
  // 外資合計 8-10, 投信 11-13, 自營商(自行買賣) 14-16, 自營商(避險) 17-19,
  // 自營商合計 20-22, 三大法人合計 23
  [Category.OTC]: {
    foreignBuy: [8],
    foreignSell: [9],
    foreignNet: [10],
    trustBuy: [11],
    trustSell: [12],
    trustNet: [13],
    dealerNet: [22],
    totalNet: [23],
  },
}

function mapRow(row: string[], category: Category): InstitutionalStockRow {
  const layout = LAYOUTS[category]
  const required = Math.max(...Object.values(layout).flat()) + 1
  if (row.length < required) {
    // Fail loudly: reading a changed layout would show plausible but wrong numbers.
    throw new Error(
      `Unexpected ${category.toUpperCase()} institutional row layout: expected at least ${required} columns, got ${
        row.length
      }`
    )
  }
  const sum = (columns: number[]) =>
    columns.reduce((total, index) => total + parseNumber(row[index]), 0)
  return {
    code: row[0].trim(),
    name: row[1].trim(),
    foreignBuy: sum(layout.foreignBuy),
    foreignSell: sum(layout.foreignSell),
    foreignNet: sum(layout.foreignNet),
    trustBuy: sum(layout.trustBuy),
    trustSell: sum(layout.trustSell),
    trustNet: sum(layout.trustNet),
    dealerNet: sum(layout.dealerNet),
    totalNet: sum(layout.totalNet),
  }
}

function adaptTseResponse(
  data: InstitutionalTseResponse
): InstitutionalStockRow[] | null {
  if (!data || data.stat !== 'OK' || !data.data || data.data.length === 0) {
    return null
  }
  return data.data.map((row) => mapRow(row, Category.TSE))
}

function adaptOtcResponse(
  data: InstitutionalOtcResponse
): InstitutionalStockRow[] | null {
  // TPEx now returns rows in tables[0].data; older responses used aaData.
  const rows = data?.tables?.[0]?.data ?? data?.aaData
  if (!rows || rows.length === 0) {
    return null
  }
  return rows.map((row) => mapRow(row, Category.OTC))
}

export function adaptInstitutionalResponse(
  data: InstitutionalTseResponse | InstitutionalOtcResponse,
  category: Category
): InstitutionalStockRow[] | null {
  if (category === Category.OTC) {
    return adaptOtcResponse(data as InstitutionalOtcResponse)
  }
  return adaptTseResponse(data as InstitutionalTseResponse)
}
