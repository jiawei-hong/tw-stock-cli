import { color } from '@/constants'

import {
  addThousandSeparator,
  formatDecimal,
  formatInteger,
  formatPercent,
  formatVolume,
} from './formatter'

describe('formatInteger', () => {
  it('formats positive value with red color and plus sign', () => {
    expect(formatInteger(1234)).toBe(`${color.red}+1,234${color.rest}`)
  })

  it('formats negative value with green color and minus sign', () => {
    expect(formatInteger(-5678)).toBe(`${color.green}-5,678${color.rest}`)
  })

  it('formats zero without color or sign', () => {
    expect(formatInteger(0)).toBe('0')
  })

  it('formats large positive value with thousands separator', () => {
    expect(formatInteger(1234567)).toBe(`${color.red}+1,234,567${color.rest}`)
  })
})

describe('formatDecimal', () => {
  it('formats positive value with red color and 2 decimal places', () => {
    expect(formatDecimal(12.5)).toBe(`${color.red}+12.50${color.rest}`)
  })

  it('formats negative value with green color and 2 decimal places', () => {
    expect(formatDecimal(-3.14)).toBe(`${color.green}-3.14${color.rest}`)
  })

  it('formats zero without color', () => {
    expect(formatDecimal(0)).toBe('0.00')
  })

  it('respects custom digits parameter', () => {
    expect(formatDecimal(1.5, 3)).toBe(`${color.red}+1.500${color.rest}`)
  })
})

describe('formatPercent', () => {
  it('formats positive value with red color and percent sign', () => {
    expect(formatPercent(12.34)).toBe(`${color.red}+12.34%${color.rest}`)
  })

  it('formats negative value with green color and percent sign', () => {
    expect(formatPercent(-5.67)).toBe(`${color.green}-5.67%${color.rest}`)
  })

  it('formats zero without color', () => {
    expect(formatPercent(0)).toBe('0.00%')
  })

  it('respects custom digits parameter', () => {
    expect(formatPercent(1.5, 1)).toBe(`${color.red}+1.5%${color.rest}`)
  })
})

describe('formatVolume', () => {
  it('formats volume with thousands separator', () => {
    expect(formatVolume(1234567)).toBe('1,234,567')
  })

  it('formats zero', () => {
    expect(formatVolume(0)).toBe('0')
  })

  it('formats small number without separator', () => {
    expect(formatVolume(999)).toBe('999')
  })
})

describe('addThousandSeparator', () => {
  it('adds separator to integer string', () => {
    expect(addThousandSeparator('1234567')).toBe('1,234,567')
  })

  it('adds separator preserving decimal part', () => {
    expect(addThousandSeparator('1234567.89')).toBe('1,234,567.89')
  })

  it('returns short numbers unchanged', () => {
    expect(addThousandSeparator('999')).toBe('999')
  })
})
