import { color } from '@/constants'

import {
  category2Chinese,
  convertToPercentage,
  getDecimalString,
  getStockUpsAndDownsPercentage,
  percentageHandle,
  shouldConvertToPercentage,
} from './stock'

describe('getDecimalString', () => {
  it('formats number to 2 decimal places by default', () => {
    expect(getDecimalString(1.23456)).toBe('1.23')
  })

  it('formats number to custom decimal places', () => {
    expect(getDecimalString(1.23456, 3)).toBe('1.235')
  })

  it('formats string input', () => {
    expect(getDecimalString('1.23456')).toBe('1.23')
  })

  it('formats zero', () => {
    expect(getDecimalString(0)).toBe('0.00')
  })

  it('formats integer', () => {
    expect(getDecimalString(100)).toBe('100.00')
  })
})

describe('shouldConvertToPercentage', () => {
  it('returns true for string with decimal point', () => {
    expect(shouldConvertToPercentage('1.23')).toBe(true)
  })

  it('returns false for string without decimal point', () => {
    expect(shouldConvertToPercentage('123')).toBe(false)
  })

  it('returns true for "0.00"', () => {
    expect(shouldConvertToPercentage('0.00')).toBe(true)
  })
})

describe('convertToPercentage', () => {
  it('formats valid number string', () => {
    expect(convertToPercentage('1.23')).toBe('1.23')
  })

  it('formats number input', () => {
    expect(convertToPercentage(1.23)).toBe('1.23')
  })

  it('returns "-" for NaN', () => {
    expect(convertToPercentage('abc')).toBe('-')
  })

  it('formats zero', () => {
    expect(convertToPercentage(0)).toBe('0.00')
  })
})

describe('percentageHandle', () => {
  it('appends % sign', () => {
    expect(percentageHandle('1.23')).toBe('1.23%')
  })

  it('handles zero as "0%"', () => {
    expect(percentageHandle('0.00')).toBe('0%')
  })

  it('handles negative', () => {
    expect(percentageHandle('-1.50')).toBe('-1.5%')
  })
})

describe('category2Chinese', () => {
  it('returns 上市 for tse', () => {
    expect(category2Chinese('tse')).toBe('上市')
  })

  it('returns 上櫃 for otc', () => {
    expect(category2Chinese('otc')).toBe('上櫃')
  })
})

describe('getStockUpsAndDownsPercentage', () => {
  it('returns red text when price goes up', () => {
    const result = getStockUpsAndDownsPercentage('100', '110')
    expect(result).toContain(color.red)
    expect(result).toContain('10%')
  })

  it('returns green text when price goes down', () => {
    const result = getStockUpsAndDownsPercentage('100', '90')
    expect(result).toContain(color.green)
    expect(result).toContain('-10%')
  })

  it('returns red text for small fractional increase', () => {
    const result = getStockUpsAndDownsPercentage('1845', '1855')
    expect(result).toContain(color.red)
    expect(result).toContain('0.54%')
  })

  it('returns green text when no change', () => {
    const result = getStockUpsAndDownsPercentage('100', '100')
    expect(result).toContain('0%')
  })
})
