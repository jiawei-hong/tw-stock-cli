import { format } from 'date-fns'

import { Category } from '@/types/stock'

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
