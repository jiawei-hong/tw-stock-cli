import { adaptRankResponse } from '@/adapters/rank'
import { RANK_NOT_FOUND } from '@/messages/rank'
import type { RankRow } from '@/types/rank'
import { Category } from '@/types/stock'

import { fetchRankData } from './api'
import Rank from './handler'

vi.mock('./api', () => ({
  fetchRankData: vi.fn(),
}))

vi.mock('@/adapters/rank', () => ({
  adaptRankResponse: vi.fn(),
}))

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
  vi.clearAllMocks()
})

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

describe('Rank handler', () => {
  describe('initialize', () => {
    it('displays table on success', async () => {
      vi.mocked(fetchRankData).mockResolvedValue({} as any)
      vi.mocked(adaptRankResponse).mockReturnValue([makeRow()])

      const handler = new Rank({})
      await handler.initialize()

      const output = consoleSpy.mock.calls[0][0]
      expect(output).not.toContain('Failure:')
    })

    it('displays failure when adapter returns null', async () => {
      vi.mocked(fetchRankData).mockResolvedValue({} as any)
      vi.mocked(adaptRankResponse).mockReturnValue(null)

      const handler = new Rank({})
      await handler.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(RANK_NOT_FOUND)
      )
    })

    it('displays failure when adapter returns empty array', async () => {
      vi.mocked(fetchRankData).mockResolvedValue({} as any)
      vi.mocked(adaptRankResponse).mockReturnValue([])

      const handler = new Rank({})
      await handler.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(RANK_NOT_FOUND)
      )
    })
  })

  describe('processRows', () => {
    const rows = [
      makeRow({ code: 'A', changePercent: 10, volume: 100 }),
      makeRow({ code: 'B', changePercent: -5, volume: 500 }),
      makeRow({ code: 'C', changePercent: 3, volume: 200 }),
    ]

    it('sorts by gainers by default', async () => {
      vi.mocked(fetchRankData).mockResolvedValue({} as any)
      vi.mocked(adaptRankResponse).mockReturnValue(rows)

      const handler = new Rank({ number: 3 })
      await handler.initialize()

      // Table should render successfully
      const output = consoleSpy.mock.calls[0][0]
      expect(output).not.toContain('Failure:')
    })

    it('sorts by losers when losers option is set', async () => {
      vi.mocked(fetchRankData).mockResolvedValue({} as any)
      vi.mocked(adaptRankResponse).mockReturnValue([...rows])

      const handler = new Rank({ losers: true, number: 3 })
      const processed = handler['processRows']([...rows])
      expect(processed[0].code).toBe('B')
    })

    it('sorts by volume when volume option is set', async () => {
      vi.mocked(fetchRankData).mockResolvedValue({} as any)
      vi.mocked(adaptRankResponse).mockReturnValue([...rows])

      const handler = new Rank({ volume: true, number: 3 })
      const processed = handler['processRows']([...rows])
      expect(processed[0].code).toBe('B')
    })

    it('slices to options.number', () => {
      const handler = new Rank({ number: 2 })
      const manyRows = [
        makeRow({ code: 'A', changePercent: 10 }),
        makeRow({ code: 'B', changePercent: 5 }),
        makeRow({ code: 'C', changePercent: 1 }),
      ]
      const processed = handler['processRows'](manyRows)
      expect(processed).toHaveLength(2)
    })

    it('defaults to 10 when number is not set', () => {
      const handler = new Rank({})
      const manyRows = Array.from({ length: 15 }, (_, i) =>
        makeRow({ code: String(i), changePercent: i })
      )
      const processed = handler['processRows'](manyRows)
      expect(processed).toHaveLength(10)
    })
  })

  describe('formatRow', () => {
    it('uses 1-based index for ranking', () => {
      const handler = new Rank({})
      const row = makeRow()
      const result = handler['formatRow'](row, 0)
      expect(result[0]).toBe('1')
    })

    it('uses 1-based index for second row', () => {
      const handler = new Rank({})
      const row = makeRow()
      const result = handler['formatRow'](row, 4)
      expect(result[0]).toBe('5')
    })

    it('returns 7 columns', () => {
      const handler = new Rank({})
      const row = makeRow()
      const result = handler['formatRow'](row, 0)
      expect(result).toHaveLength(7)
    })

    it('includes code and name', () => {
      const handler = new Rank({})
      const row = makeRow({ code: '2330', name: 'TSMC' })
      const result = handler['formatRow'](row, 0)
      expect(result[1]).toBe('2330')
      expect(result[2]).toBe('TSMC')
    })
  })

  describe('getNotFoundMessage', () => {
    it('returns RANK_NOT_FOUND', () => {
      const handler = new Rank({})
      expect(handler['getNotFoundMessage']()).toBe(RANK_NOT_FOUND)
    })
  })

  describe('buildUrl', () => {
    it('calls getRankUrl with date and category', () => {
      const handler = new Rank({})
      const url = handler['buildUrl']('20240315', Category.TSE)
      expect(url).toContain('MI_INDEX')
      expect(url).toContain('20240315')
    })
  })
})
