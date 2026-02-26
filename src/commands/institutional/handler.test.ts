import { adaptInstitutionalResponse } from '@/adapters/institutional'
import {
  INSTITUTIONAL_NOT_FOUND,
  INSTITUTIONAL_STOCK_NOT_FOUND,
} from '@/messages/institutional'
import { Category } from '@/types/stock'

import { fetchInstitutionalData } from './api'
import Field from './field'
import Institutional from './handler'

vi.mock('./api', () => ({
  fetchInstitutionalData: vi.fn(),
}))

vi.mock('@/adapters/institutional', () => ({
  adaptInstitutionalResponse: vi.fn(),
}))

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
  vi.clearAllMocks()
})

describe('Institutional handler', () => {
  describe('initialize without code (summary mode)', () => {
    it('displays summary table on success', async () => {
      vi.mocked(fetchInstitutionalData).mockResolvedValue({
        stat: 'OK',
        data: [['自營商', '1,000', '500', '500']],
      } as any)

      const handler = new Institutional('', {})
      await handler.initialize()

      expect(fetchInstitutionalData).toHaveBeenCalled()
      const output = consoleSpy.mock.calls[0][0]
      expect(output).not.toContain('Failure:')
    })

    it('displays failure when summary data is empty', async () => {
      vi.mocked(fetchInstitutionalData).mockResolvedValue({
        stat: 'OK',
        data: [],
      } as any)

      const handler = new Institutional('', {})
      await handler.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(INSTITUTIONAL_NOT_FOUND)
      )
    })

    it('displays failure when summary stat is not OK', async () => {
      vi.mocked(fetchInstitutionalData).mockResolvedValue({
        stat: 'FAIL',
        data: [],
      } as any)

      const handler = new Institutional('', {})
      await handler.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(INSTITUTIONAL_NOT_FOUND)
      )
    })

    it('displays failure when fetch returns null', async () => {
      vi.mocked(fetchInstitutionalData).mockResolvedValue(null as any)

      const handler = new Institutional('', {})
      await handler.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(INSTITUTIONAL_NOT_FOUND)
      )
    })
  })

  describe('initialize with code (stock mode)', () => {
    it('displays stock table when stock is found', async () => {
      vi.mocked(fetchInstitutionalData).mockResolvedValue({} as any)
      vi.mocked(adaptInstitutionalResponse).mockReturnValue([
        {
          code: '2330',
          name: 'TSMC',
          foreignBuy: 1000,
          foreignSell: 500,
          foreignNet: 500,
          trustBuy: 200,
          trustSell: 100,
          trustNet: 100,
          dealerNet: 50,
          totalNet: 650,
        },
      ])

      const handler = new Institutional('2330', {})
      await handler.initialize()

      const output = consoleSpy.mock.calls[0][0]
      expect(output).not.toContain('Failure:')
    })

    it('displays failure when stock code not found in data', async () => {
      vi.mocked(fetchInstitutionalData).mockResolvedValue({} as any)
      vi.mocked(adaptInstitutionalResponse).mockReturnValue([
        {
          code: '2317',
          name: 'Foxconn',
          foreignBuy: 0,
          foreignSell: 0,
          foreignNet: 0,
          trustBuy: 0,
          trustSell: 0,
          trustNet: 0,
          dealerNet: 0,
          totalNet: 0,
        },
      ])

      const handler = new Institutional('2330', {})
      await handler.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(INSTITUTIONAL_STOCK_NOT_FOUND)
      )
    })

    it('displays failure when adapter returns null', async () => {
      vi.mocked(fetchInstitutionalData).mockResolvedValue({} as any)
      vi.mocked(adaptInstitutionalResponse).mockReturnValue(null)

      const handler = new Institutional('2330', {})
      await handler.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(INSTITUTIONAL_STOCK_NOT_FOUND)
      )
    })

    it('filters rows by matching code (case-insensitive)', async () => {
      vi.mocked(fetchInstitutionalData).mockResolvedValue({} as any)
      vi.mocked(adaptInstitutionalResponse).mockReturnValue([
        {
          code: '2330',
          name: 'TSMC',
          foreignBuy: 0,
          foreignSell: 0,
          foreignNet: 100,
          trustBuy: 0,
          trustSell: 0,
          trustNet: 50,
          dealerNet: 25,
          totalNet: 175,
        },
        {
          code: '2317',
          name: 'Foxconn',
          foreignBuy: 0,
          foreignSell: 0,
          foreignNet: 0,
          trustBuy: 0,
          trustSell: 0,
          trustNet: 0,
          dealerNet: 0,
          totalNet: 0,
        },
      ])

      const handler = new Institutional('2330', {})
      await handler.initialize()

      // Should display table (not failure)
      const output = consoleSpy.mock.calls[0][0]
      expect(output).not.toContain('Failure:')
    })
  })

  describe('getNotFoundMessage', () => {
    it('returns stock-specific message when code is set', () => {
      const handler = new Institutional('2330', {})
      expect(handler['getNotFoundMessage']()).toBe(
        INSTITUTIONAL_STOCK_NOT_FOUND
      )
    })

    it('returns general message when code is empty', () => {
      const handler = new Institutional('', {})
      expect(handler['getNotFoundMessage']()).toBe(INSTITUTIONAL_NOT_FOUND)
    })
  })

  describe('getFields', () => {
    it('returns stock fields', () => {
      const handler = new Institutional('2330', {})
      expect(handler['getFields']()).toEqual(Field.stock())
    })
  })

  describe('formatRow', () => {
    it('returns formatted string array', () => {
      const handler = new Institutional('2330', {})
      const row = {
        code: '2330',
        name: 'TSMC',
        foreignBuy: 1000,
        foreignSell: 500,
        foreignNet: 500,
        trustBuy: 200,
        trustSell: 100,
        trustNet: 100,
        dealerNet: 50,
        totalNet: 650,
      }
      const result = handler['formatRow'](row, 0)
      expect(result).toHaveLength(6)
      expect(result[0]).toBe('2330')
      expect(result[1]).toBe('TSMC')
    })
  })
})
