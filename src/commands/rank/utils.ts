import { RankRow } from '@/types/rank'
import { formatDecimal, formatPercent, formatVolume } from '@/utils/formatter'
import { parseNumber } from '@/utils/number'

export { formatDecimal as formatPriceChange }
export { formatPercent as formatPercentage }
export { formatVolume }

export function calculateChangePercent(close: number, change: number): number {
  const previous = close - change
  if (previous === 0) return 0
  return (change / previous) * 100
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
