import { color } from '@/constants'
import { RankRow } from '@/types/rank'
import { parseNumber } from '@/utils/number'

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
