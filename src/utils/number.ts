export function parseNumber(value: string): number {
  if (typeof value !== 'string') return 0
  const cleaned = value.replace(/,/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

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
