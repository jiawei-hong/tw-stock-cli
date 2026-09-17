import {
  filterScreen,
  parseScreen,
  ScreenOptions,
  validateScreen,
} from '@/commands/screen/handler'
import { Category } from '@/types/stock'

const rows = [
  { code: '0050', name: 'ETF', close: 100, volume: 10000, changePercent: 2 },
  { code: '2330', name: 'TSMC', close: 1000, volume: 20000, changePercent: -2 },
  { code: '1101', name: 'Cement', close: 50, volume: 10000 },
]

it('combines inclusive bounds and preserves missing values', () => {
  expect(
    filterScreen(rows, {
      minPrice: 100,
      maxPrice: 100,
      minVolume: 10000,
      maxVolume: 10000,
      minChange: 2,
      maxChange: 2,
    })
  ).toEqual([rows[0]])
  expect(filterScreen(rows, { maxChange: 0 })).toEqual([rows[1]])
  expect(filterScreen(rows, { minChange: 3 })).toEqual([])
  expect(filterScreen(rows, { maxPrice: 50 })).toEqual([rows[2]])
})

it('sorts all matches descending with deterministic ties before limiting', () => {
  expect(filterScreen(rows, {}).map((row) => row.code)).toEqual([
    '2330',
    '0050',
    '1101',
  ])
  expect(filterScreen(rows, { sort: 'price' }).map((row) => row.code)).toEqual([
    '2330',
    '0050',
    '1101',
  ])
  expect(filterScreen(rows, { sort: 'change' }).map((row) => row.code)).toEqual(
    ['0050', '2330', '1101']
  )
})

it.each<ScreenOptions>([
  { minPrice: -1 },
  { maxVolume: Infinity },
  { minVolume: 1.5 },
  { minChange: NaN },
  { minPrice: 2, maxPrice: 1 },
  { minVolume: 2, maxVolume: 1 },
  { minChange: 2, maxChange: 1 },
  { number: 0 },
  { number: 1.5 },
  { date: '2026-02-30' },
  { date: '2026-9-01' },
  { sort: 'bad' as 'price' },
])('rejects invalid options %j', (options) =>
  expect(() => validateScreen(options)).toThrow()
)

it('parses signed TWSE changes and rejects missing volume instead of coercing to zero', () => {
  const result = parseScreen(
    {
      stat: 'OK',
      date: '20260907',
      tables: [
        {
          title: '每日收盤行情',
          data: [
            [
              '2330',
              'TSMC',
              '1,000',
              '',
              '',
              '',
              '',
              '',
              '98',
              '<p>-</p>',
              '2',
            ],
            ['0050', 'ETF', '2,000', '', '', '', '', '', '100', 'X', '0'],
            ['1101', 'Cement', '-', '', '', '', '', '', '50', '+', '1'],
          ],
        },
      ],
    },
    Category.TSE
  )
  expect(result.date).toBe('2026-09-07')
  expect(result.rows[0].changePercent).toBe(-2)
  expect(result.rows[1].changePercent).toBeUndefined()
  expect(result.skipped).toBe(1)
})

it('accepts TPEx lowercase status and does not invent a change percent', () => {
  const result = parseScreen(
    {
      stat: 'ok',
      date: '20260907',
      tables: [
        {
          data: [
            ['6488', 'GlobalWafers', '102', '+2', '', '', '', '', '10,000'],
            ['6547', 'Medigen', '42.5', '除息', '', '', '', '', '1,000'],
          ],
        },
      ],
    },
    Category.OTC
  )
  expect(result.rows[0].changePercent).toBe(2)
  expect(result.rows[1].changePercent).toBeUndefined()
})

it('rejects missing dates and malformed responses', () => {
  expect(() => parseScreen({ stat: 'OK', tables: [] }, Category.TSE)).toThrow(
    'source date'
  )
  expect(() => parseScreen({ stat: 'ERROR' }, Category.TSE)).toThrow(
    'unavailable'
  )
  expect(() =>
    parseScreen({ stat: 'OK', date: '20260907', tables: [] }, Category.TSE)
  ).toThrow('unavailable')
})
