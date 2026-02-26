import { color } from '@/constants'

export function formatNetValue(value: number): string {
  const formatted = Math.abs(value).toLocaleString('en-US')
  if (value > 0) {
    return `${color.red}+${formatted}${color.rest}`
  }
  if (value < 0) {
    return `${color.green}-${formatted}${color.rest}`
  }
  return formatted
}
