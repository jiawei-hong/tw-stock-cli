import { format } from 'date-fns'

import { color } from '@/constants'
import { RankRow } from '@/types/rank'
import { Category } from '@/types/stock'

import type { FieldProps } from './field'

export function getFormattedDate(
  date: string | undefined,
  category: Category
): string {
  if (!date) return ''
  const d = new Date(date)
  if (category === Category.OTC) {
    const year = d.getFullYear() - 1911
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }
  return format(d, 'yyyyMMdd')
}

export function calculateChangePercent(close: number, change: number): number {
  const previous = close - change
  if (previous === 0) return 0
  return (change / previous) * 100
}

export function formatPriceChange(value: number): string {
  const formatted = Math.abs(value).toFixed(2)
  if (value > 0) {
    return `${color.red}+${formatted}${color.rest}`
  }
  if (value < 0) {
    return `${color.green}-${formatted}${color.rest}`
  }
  return formatted
}

export function formatPercentage(value: number): string {
  const formatted = Math.abs(value).toFixed(2) + '%'
  if (value > 0) {
    return `${color.red}+${formatted}${color.rest}`
  }
  if (value < 0) {
    return `${color.green}-${formatted}${color.rest}`
  }
  return formatted
}

export function formatVolume(value: number): string {
  return value.toLocaleString('en-US')
}

export function parseNumber(value: string): number {
  if (typeof value !== 'string') return 0
  const cleaned = value.replace(/,/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

export function parseTseChange(direction: string, value: string): number {
  const amount = parseNumber(value)
  if (direction.includes('-')) {
    return -amount
  }
  return amount
}

export function sortRows(
  rows: RankRow[],
  mode: 'gainers' | 'losers' | 'volume'
): RankRow[] {
  if (mode === 'volume') {
    return [...rows].sort((a, b) => b.volume - a.volume)
  }
  if (mode === 'losers') {
    return [...rows].sort((a, b) => a.changePercent - b.changePercent)
  }
  return [...rows].sort((a, b) => b.changePercent - a.changePercent)
}

export function getTableHeader(headerField: FieldProps[]): string[] {
  return headerField.map((field) => field.name)
}
