import { Category } from '@/types/stock'

import { getFormattedDate } from './date'

describe('getFormattedDate', () => {
  it('returns empty string when date is undefined', () => {
    expect(getFormattedDate(undefined, Category.TSE)).toBe('')
  })

  it('returns empty string when date is empty string', () => {
    expect(getFormattedDate('', Category.TSE)).toBe('')
  })

  it('delegates to TSE strategy for TSE category', () => {
    expect(getFormattedDate('2024-03-15', Category.TSE)).toBe('20240315')
  })

  it('delegates to OTC strategy for OTC category', () => {
    expect(getFormattedDate('2024-03-15', Category.OTC)).toBe('113/03/15')
  })

  it('returns empty string for invalid date', () => {
    expect(getFormattedDate('not-a-date', Category.TSE)).toBe('')
  })
})
