import { RankRow } from '@/types/rank'
import { formatDecimal, formatPercent, formatVolume } from '@/utils/formatter'

export { formatDecimal as formatPriceChange }
export { formatPercent as formatPercentage }
export { formatVolume }

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
