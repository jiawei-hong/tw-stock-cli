export function taipeiToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

export function marketDate(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const compact = value.replaceAll('/', '').replaceAll('-', '').trim()
  if (!/^\d{7,8}$/.test(compact)) return undefined
  const yearLength = compact.length - 4
  const year =
    Number(compact.slice(0, yearLength)) + (yearLength === 3 ? 1911 : 0)
  const date = `${year}-${compact.slice(-4, -2)}-${compact.slice(-2)}`
  return validDate(date) ? date : undefined
}

export function strictNumber(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  if (!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(text))
    return undefined
  const number = Number(text.replaceAll(',', ''))
  return Number.isFinite(number) ? number : undefined
}
