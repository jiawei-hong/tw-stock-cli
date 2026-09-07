import stringWidth from 'string-width'

import { Category } from '@/types/stock'

import { getStock } from './api'
import HistoryStock from './history-handler'

vi.mock('./api', () => ({ getStock: vi.fn() }))

describe('responsive stock history', () => {
  const originalColumns = process.stdout.columns
  afterEach(() => {
    Object.defineProperty(process.stdout, 'columns', {
      value: originalColumns,
      configurable: true,
    })
    vi.restoreAllMocks()
  })

  it.each([20, 40, 80, 120, 200])(
    'preserves historical values at width %i',
    async (width) => {
      Object.defineProperty(process.stdout, 'columns', {
        value: width,
        configurable: true,
      })
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.mocked(getStock).mockResolvedValue({
        stat: 'OK',
        data: [
          [
            '115/09/07',
            '1,234',
            '1,234,000',
            '998.00',
            '1,010.00',
            '995.00',
            '1,000.00',
            '+2.00',
            '321',
          ],
        ],
      } as unknown as Awaited<ReturnType<typeof getStock>>)
      await new HistoryStock('2330', {
        date: '2026-09',
        listed: Category.TSE,
      }).execute()
      const output = spy.mock.calls[0][0] as string
      for (const line of output.split('\n'))
        expect(stringWidth(line)).toBeLessThanOrEqual(width)
      const normalized = output.replace(/[|\s]/g, '')
      for (const value of [
        '115/09/07',
        '1,234,000',
        '1,000.00',
        '+2.00',
        '321',
      ]) {
        expect(normalized).toContain(value)
      }
      expect(output).not.toContain('今日成交')
      expect(output).not.toContain('報價狀態')
    }
  )
})
