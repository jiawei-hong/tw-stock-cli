import stringWidth from 'string-width'

import {
  renderHistoryChart,
  sampleCloses,
} from '@/commands/stock/chart-handler'
import Stock from '@/commands/stock/handler'
import { Category, StockOptionProps } from '@/types/stock'

const originalColumns = process.stdout.columns
afterEach(() => {
  Object.defineProperty(process.stdout, 'columns', {
    configurable: true,
    value: originalColumns,
  })
  vi.restoreAllMocks()
})

it.each([20, 40, 80])(
  'keeps a long chart within %i columns and retains full-data extrema',
  (width) => {
    Object.defineProperty(process.stdout, 'columns', {
      configurable: true,
      value: width,
    })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const points = Array.from({ length: 200 }, (_, index) => ({
      date: '2026-09-01',
      close: index === 123 ? 9999.99 : 100 + index,
    }))
    renderHistoryChart(points, '2330', Category.TSE)
    const output = log.mock.calls.map((call) => call[0]).join('\n')
    for (const line of output.split('\n'))
      expect(stringWidth(line)).toBeLessThanOrEqual(width)
    expect(output.replace(/\s/g, '')).toContain('9999.99')
    const sampled = sampleCloses(points, 10)
    expect(sampled[0]).toBe(100)
    expect(sampled.at(-1)).toBe(299)
  }
)

it('renders a single decimal closing price without rounding the axis to an integer', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  renderHistoryChart(
    [{ date: '2026-09-01', close: 42.5 }],
    '6547',
    Category.OTC
  )
  expect(log.mock.calls[0][0]).toContain('42.50')
})

it.each<StockOptionProps>([
  { range: '3m' },
  { chart: true, range: '3m', date: '2026-09' },
  { chart: true, watch: 5 },
  { chart: true, favorite: true },
  { chart: true, multiple: true },
  { chart: true, search: '台積電' },
  { chart: true, oddLot: true },
])('rejects conflicting modes %j', (options) =>
  expect(() => new Stock('2330', options)).toThrow()
)
