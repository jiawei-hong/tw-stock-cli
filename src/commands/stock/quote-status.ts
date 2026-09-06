import { TStock } from '@/types/stock'

function quoteDate(value: string): string | undefined {
  if (!/^\d{8}$/.test(value ?? '')) return undefined
  const date = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`
  const parsed = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime())) return undefined
  return parsed.toISOString().slice(0, 10) === date ? date : undefined
}

export function quoteTimestamp(stock: TStock): string {
  const date = quoteDate(stock.d)
  if (!date) return '-'
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(stock.t ?? '')
    ? stock.t
    : '-'
  return `${date} ${time}`
}

export function quoteStatus(stock: TStock, now = new Date()): string {
  if (!/^\d+(?:\.\d+)?$/.test(stock.z ?? '')) return '無成交價'
  const date = quoteDate(stock.d)
  if (!date) return '日期未知'
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) =>
    parts.find((entry) => entry.type === type)?.value
  const today = `${part('year')}-${part('month')}-${part('day')}`
  if (date > today) return '日期異常'
  return date === today ? '今日成交' : '前期成交'
}
