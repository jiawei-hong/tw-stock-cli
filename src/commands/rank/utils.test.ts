import type { RankRow } from '@/types/rank'

import { sortRows } from './utils'

function makeRow(overrides: Partial<RankRow> = {}): RankRow {
  return {
    code: '2330',
    name: 'TSMC',
    close: 600,
    change: 10,
    changePercent: 1.69,
    volume: 50000,
    ...overrides,
  }
}

describe('sortRows', () => {
  const rows: RankRow[] = [
    makeRow({ code: 'A', changePercent: 5, volume: 100 }),
    makeRow({ code: 'B', changePercent: -3, volume: 500 }),
    makeRow({ code: 'C', changePercent: 10, volume: 200 }),
  ]

  it('sorts by changePercent descending for gainers mode', () => {
    const result = sortRows(rows, 'gainers')
    expect(result.map((r) => r.code)).toEqual(['C', 'A', 'B'])
  })

  it('sorts by changePercent ascending for losers mode', () => {
    const result = sortRows(rows, 'losers')
    expect(result.map((r) => r.code)).toEqual(['B', 'A', 'C'])
  })

  it('sorts by volume descending for volume mode', () => {
    const result = sortRows(rows, 'volume')
    expect(result.map((r) => r.code)).toEqual(['B', 'C', 'A'])
  })

  it('does not mutate the original array', () => {
    const original = [...rows]
    sortRows(rows, 'gainers')
    expect(rows).toEqual(original)
  })

  it('returns empty array when input is empty', () => {
    expect(sortRows([], 'gainers')).toEqual([])
  })

  it('handles single element array', () => {
    const single = [makeRow({ code: 'X' })]
    const result = sortRows(single, 'gainers')
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('X')
  })

  it('handles rows with equal changePercent in gainers mode', () => {
    const equalRows = [
      makeRow({ code: 'A', changePercent: 5 }),
      makeRow({ code: 'B', changePercent: 5 }),
    ]
    const result = sortRows(equalRows, 'gainers')
    expect(result).toHaveLength(2)
  })

  it('handles rows with equal volume in volume mode', () => {
    const equalRows = [
      makeRow({ code: 'A', volume: 100 }),
      makeRow({ code: 'B', volume: 100 }),
    ]
    const result = sortRows(equalRows, 'volume')
    expect(result).toHaveLength(2)
  })
})
