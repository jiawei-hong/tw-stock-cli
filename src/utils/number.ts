export function parseNumber(value: string): number {
  if (typeof value !== 'string') return 0
  const cleaned = value.replace(/,/g, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}
