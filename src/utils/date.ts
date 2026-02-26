import { createExchangeStrategy } from '@/strategies/exchange'
import { Category } from '@/types/stock'

export function getFormattedDate(
  date: string | undefined,
  category: Category
): string {
  if (!date) return ''
  const strategy = createExchangeStrategy(category)
  return strategy.formatDate(date)
}
