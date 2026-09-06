import { TStock } from '@/types/stock'

import { quoteStatus, quoteTimestamp } from './quote-status'

const quote = { d: '20260907', t: '09:30:00', z: '100' } as TStock
const now = new Date('2026-09-06T16:30:00Z')

describe('quote status', () => {
  it('uses the Taipei date across the UTC midnight boundary', () => {
    expect(quoteStatus(quote, now)).toBe('今日成交')
    expect(quoteStatus({ ...quote, d: '20260904' }, now)).toBe('前期成交')
  })

  it.each(['-', '', undefined])(
    'marks unavailable price %s explicitly',
    (price) => {
      expect(quoteStatus({ ...quote, z: price } as TStock, now)).toBe(
        '無成交價'
      )
    }
  )

  it('does not claim freshness for missing, invalid, or future dates', () => {
    expect(quoteStatus({ ...quote, d: '' }, now)).toBe('日期未知')
    expect(quoteStatus({ ...quote, d: '20260230' }, now)).toBe('日期未知')
    expect(quoteStatus({ ...quote, d: '20260908' }, now)).toBe('日期異常')
  })

  it('formats the full exchange timestamp without inventing missing values', () => {
    expect(quoteTimestamp(quote)).toBe('2026-09-07 09:30:00')
    expect(quoteTimestamp({ ...quote, t: '25:00:00' })).toBe('2026-09-07 -')
    expect(quoteTimestamp({ ...quote, d: '' })).toBe('-')
  })
})
