import {
  InstitutionalOtcResponse,
  InstitutionalStockRow,
  InstitutionalTseResponse,
} from '@/types/institutional'
import { Category } from '@/types/stock'
import { parseNumber } from '@/utils/number'

function mapRowToStockRow(row: string[]): InstitutionalStockRow {
  return {
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
  }
}

function adaptTseResponse(
  data: InstitutionalTseResponse
): InstitutionalStockRow[] | null {
  if (!data || data.stat !== 'OK' || !data.data || data.data.length === 0) {
    return null
  }
  return data.data.map(mapRowToStockRow)
}

function adaptOtcResponse(
  data: InstitutionalOtcResponse
): InstitutionalStockRow[] | null {
  if (!data || !data.aaData || data.aaData.length === 0) {
    return null
  }
  return data.aaData.map(mapRowToStockRow)
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
