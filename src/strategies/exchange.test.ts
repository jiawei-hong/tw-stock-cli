import { Category } from '@/types/stock'

import { createExchangeStrategy } from './exchange'

describe('createExchangeStrategy', () => {
  it('returns a strategy with TSE category by default', () => {
    const strategy = createExchangeStrategy(Category.TSE)
    expect(strategy.category).toBe(Category.TSE)
  })

  it('returns a strategy with OTC category', () => {
    const strategy = createExchangeStrategy(Category.OTC)
    expect(strategy.category).toBe(Category.OTC)
  })
})

describe('TseStrategy.formatDate', () => {
  const strategy = createExchangeStrategy(Category.TSE)

  it('returns empty string for empty input', () => {
    expect(strategy.formatDate('')).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(strategy.formatDate('not-a-date')).toBe('')
  })

  it('formats date as yyyyMMdd', () => {
    expect(strategy.formatDate('2024-03-15')).toBe('20240315')
  })

  it('formats date with single-digit month and day', () => {
    expect(strategy.formatDate('2024-01-05')).toBe('20240105')
  })
})

describe('OtcStrategy.formatDate', () => {
  const strategy = createExchangeStrategy(Category.OTC)

  it('returns empty string for empty input', () => {
    expect(strategy.formatDate('')).toBe('')
  })

  it('returns empty string for invalid date', () => {
    expect(strategy.formatDate('not-a-date')).toBe('')
  })

  it('formats date as ROC year/MM/dd', () => {
    expect(strategy.formatDate('2024-03-15')).toBe('113/03/15')
  })

  it('formats date with single-digit month and day using zero-padding', () => {
    expect(strategy.formatDate('2024-01-05')).toBe('113/01/05')
  })
})
