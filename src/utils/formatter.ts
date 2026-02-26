import { color } from '@/constants'

/**
 * Core colored number formatter.
 * Positive → red with '+', Negative → green with '-', Zero → plain.
 */
function applyColor(
  value: number,
  formatFn: (absValue: number) => string
): string {
  const formatted = formatFn(Math.abs(value))
  if (value > 0) {
    return `${color.red}+${formatted}${color.rest}`
  }
  if (value < 0) {
    return `${color.green}-${formatted}${color.rest}`
  }
  return formatted
}

/** Format integer with thousands separator and color (e.g. +1,234 / -5,678) */
export function formatInteger(value: number): string {
  return applyColor(value, (v) => v.toLocaleString('en-US'))
}

/** Format decimal with thousands separator and color (e.g. +1,234.56) */
export function formatDecimal(value: number, digits = 2): string {
  return applyColor(value, (v) => v.toFixed(digits))
}

/** Format percentage with color (e.g. +12.34%) */
export function formatPercent(value: number, digits = 2): string {
  return applyColor(value, (v) => v.toFixed(digits) + '%')
}

/** Format volume with thousands separator, no color (e.g. 1,234,567) */
export function formatVolume(value: number): string {
  return value.toLocaleString('en-US')
}

/** Add thousands separator to a string number (e.g. "1234567.89" → "1,234,567.89") */
export function addThousandSeparator(text: string): string {
  const parts = text.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}
