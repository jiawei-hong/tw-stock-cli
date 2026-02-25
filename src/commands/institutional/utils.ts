import { format } from 'date-fns'

import { color } from '@/constants'
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

export function formatNetValue(value: number): string {
  const formatted = Math.abs(value).toLocaleString('en-US')
  if (value > 0) {
    return `${color.red}+${formatted}${color.rest}`
  }
  if (value < 0) {
    return `${color.green}-${formatted}${color.rest}`
  }
  return formatted
}

export function parseNumber(value: string): number {
  if (typeof value !== 'string') return 0
  return parseInt(value.replace(/,/g, ''), 10) || 0
}

export function getTableHeader(headerField: FieldProps[]): string[] {
  return headerField.map((field) => field.name)
}
