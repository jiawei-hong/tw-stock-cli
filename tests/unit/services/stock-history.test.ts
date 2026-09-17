import {
  historyUrl,
  historyWindow,
  loadHistory,
  parseHistory,
} from '@/services/stock-history'
import { Category } from '@/types/stock'
import { requestJson } from '@/utils/http'

vi.mock('@/utils/http', () => ({ requestJson: vi.fn() }))
afterEach(() => vi.resetAllMocks())

it('clamps month ends and uses the Taipei calendar date', () => {
  expect(
    historyWindow('1m', undefined, new Date('2024-03-30T16:00:00Z'))
  ).toEqual({
    start: '2024-02-29',
    end: '2024-03-31',
    months: ['2024-02', '2024-03'],
  })
  const year = historyWindow('1y', undefined, new Date('2026-01-15T12:00:00Z'))
  expect(year.start).toBe('2025-01-15')
  expect(year.months).toHaveLength(13)
  expect(historyWindow('1m', '2024-02').end).toBe('2024-02-29')
})

it('rejects unsupported ranges and invalid chart months', () => {
  expect(() => historyWindow('2m')).toThrow('--range')
  expect(() => historyWindow('toString')).toThrow('--range')
  expect(() => historyWindow('1m', '2026-13')).toThrow('YYYY-MM')
  expect(() => historyWindow('1m', '2026-09-01')).toThrow('YYYY-MM')
})

it('uses the official TPEx endpoint with Gregorian dates', () => {
  const url = new URL(historyUrl('00679B', '2026-09', Category.OTC))
  expect(url.pathname).toBe('/www/zh-tw/afterTrading/tradingStock')
  expect(url.searchParams.get('date')).toBe('2026/09/01')
  expect(url.searchParams.get('code')).toBe('00679B')
})

it('parses both markets and omits unavailable prices without turning them into zero', () => {
  const rows = [
    ['115/09/01', '', '', '', '', '', '1,000.50'],
    ['115/09/02', '', '', '', '', '', '-'],
    ['115/09/03', '', '', '', '', '', 'NaN'],
    ['115/09/04', '', '', '', '', '', '0'],
  ]
  const expected = [{ date: '2026-09-01', close: 1000.5 }]
  expect(parseHistory({ stat: 'OK', data: rows }, '2026-09')).toEqual(expected)
  expect(
    parseHistory({ stat: 'ok', tables: [{ data: rows }] }, '2026-09')
  ).toEqual(expected)
  expect(() => parseHistory({ stat: 'OK', data: rows }, '2026-08')).toThrow(
    'unexpected date'
  )
  expect(() =>
    parseHistory({ stat: 'OK', data: [['115/09/31']] }, '2026-09')
  ).toThrow('unexpected date')
  expect(() => parseHistory(null, '2026-09')).toThrow('Invalid')
})

it('merges, sorts, deduplicates and clips months to the requested window', async () => {
  vi.mocked(requestJson)
    .mockResolvedValueOnce({
      stat: 'OK',
      data: [
        ['115/08/31', '', '', '', '', '', '20'],
        ['115/08/01', '', '', '', '', '', '10'],
      ],
    })
    .mockResolvedValueOnce({
      stat: 'ok',
      tables: [
        {
          data: [
            ['115/09/02', '', '', '', '', '', '30'],
            ['115/09/01', '', '', '', '', '', '25'],
            ['115/09/01', '', '', '', '', '', '25'],
            ['115/09/30', '', '', '', '', '', '40'],
          ],
        },
      ],
    })
  expect(
    await loadHistory('2330', Category.TSE, {
      start: '2026-08-15',
      end: '2026-09-15',
      months: ['2026-08', '2026-09'],
    })
  ).toEqual([
    { date: '2026-08-31', close: 20 },
    { date: '2026-09-01', close: 25 },
    { date: '2026-09-02', close: 30 },
  ])
})

it('fails an incomplete download instead of plotting partial history', async () => {
  vi.mocked(requestJson)
    .mockResolvedValueOnce({ stat: 'OK', data: [] })
    .mockRejectedValueOnce(new Error('offline'))
  await expect(
    loadHistory('2330', Category.TSE, {
      start: '2026-08-01',
      end: '2026-09-30',
      months: ['2026-08', '2026-09'],
    })
  ).rejects.toThrow('2026-09')
})
