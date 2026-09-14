import stringWidth from 'string-width'

import { getStock } from '@/commands/stock/api'
import HistoryStock from '@/commands/stock/history-handler'
import { SOMETHING_WRONG, STOCK_NOT_FOUND } from '@/messages/stock'
import { Category } from '@/types/stock'

vi.mock('@/commands/stock/api', () => ({ getStock: vi.fn() }))

describe('responsive stock history', () => {
  const originalColumns = process.stdout.columns
  afterEach(() => {
    vi.mocked(getStock).mockReset()
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

  it('reports an error when no stock code is provided', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    new HistoryStock(undefined, { date: '2026-09' }).initialize()

    expect(spy).toHaveBeenCalledWith(expect.stringContaining(SOMETHING_WRONG))
  })

  it('reports no history when the date format is invalid', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await new HistoryStock('2330', { date: 'not-a-date' }).execute()

    expect(getStock).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(STOCK_NOT_FOUND))
  })

  it('filters a daily TWSE response to the requested trading day', async () => {
    Object.defineProperty(process.stdout, 'columns', {
      value: 120,
      configurable: true,
    })
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(getStock).mockResolvedValue({
      stat: 'OK',
      aaData: [
        ['115/09/07', '1', '2', '3', '4', '2', '3', '1', '5'],
        ['115/09/08', '9', '9', '9', '9', '9', '9', '9', '9'],
      ],
    } as unknown as Awaited<ReturnType<typeof getStock>>)

    await new HistoryStock('2330', {
      date: '2026-09-07',
      listed: Category.TSE,
    }).execute()

    expect(getStock).toHaveBeenCalledWith(
      expect.stringContaining('twse.com.tw')
    )
    expect(spy.mock.calls[0][0]).toContain('115/09/07')
    expect(spy.mock.calls[0][0]).not.toContain('115/09/08')
  })

  it('uses the TPEx endpoint for monthly OTC history', async () => {
    Object.defineProperty(process.stdout, 'columns', {
      value: 120,
      configurable: true,
    })
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(getStock).mockResolvedValue({
      stat: 'OK',
      aaData: [['115/09/07', '1', '2', '3', '4', '2', '3', '1', '5']],
    } as unknown as Awaited<ReturnType<typeof getStock>>)

    await new HistoryStock('6547', {
      date: '2026-09',
      listed: Category.OTC,
    }).execute()

    expect(getStock).toHaveBeenCalledWith(
      expect.stringContaining('tpex.org.tw')
    )
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('115/09/07'))
  })

  it('reports no history when the requested day is absent', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(getStock).mockResolvedValue({
      stat: 'OK',
      data: [['115/09/08', '1', '2', '3', '4', '2', '3', '1', '5']],
    } as unknown as Awaited<ReturnType<typeof getStock>>)

    await new HistoryStock('2330', {
      date: '2026-09-07',
      listed: Category.TSE,
    }).execute()

    expect(spy).toHaveBeenCalledWith(expect.stringContaining(STOCK_NOT_FOUND))
  })

  it('reports malformed history responses as not found', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(getStock).mockResolvedValue({ stat: 'ERROR' } as any)

    await new HistoryStock('2330', { date: '2026-09' }).execute()

    expect(spy).toHaveBeenCalledWith(expect.stringContaining(STOCK_NOT_FOUND))
  })
})
