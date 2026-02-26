import { format } from 'date-fns'

import { Category } from '@/types/stock'

export interface ExchangeStrategy {
  readonly category: Category
  formatDate(date: string): string
}

class TseStrategy implements ExchangeStrategy {
  readonly category = Category.TSE

  formatDate(date: string): string {
    if (!date) return ''
    const d = new Date(date)
    return format(d, 'yyyyMMdd')
  }
}

class OtcStrategy implements ExchangeStrategy {
  readonly category = Category.OTC

  formatDate(date: string): string {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear() - 1911
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
  }
}

export function createExchangeStrategy(category: Category): ExchangeStrategy {
  if (category === Category.OTC) return new OtcStrategy()
  return new TseStrategy()
}
