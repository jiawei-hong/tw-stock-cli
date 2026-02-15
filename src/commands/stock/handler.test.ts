import { FAVORITE_NOT_FOUND } from '@/messages/favorite'
import {
  STOCK_NOT_FOUND,
  STOCK_NOT_FOUND_FILE,
  STOCK_SEARCH_BUT_NOT_GIVE_CODE,
} from '@/messages/stock'
import { Category } from '@/types/stock'
import FilePath from '@/utils/file'

import { getStock as getStockData } from './api'
import Stock from './handler'

vi.mock('@/utils/file', () => ({
  default: {
    stock: {
      read: vi.fn(),
      write: vi.fn(),
      exist: vi.fn(),
    },
    favorite: {
      read: vi.fn(),
      write: vi.fn(),
      exist: vi.fn(),
    },
  },
}))

vi.mock('./api', () => ({
  getStock: vi.fn(),
}))

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
  vi.clearAllMocks()
})

describe('Stock', () => {
  describe('initialize', () => {
    it('displays error when no code and no favorite/date option', () => {
      const stock = new Stock('', { listed: Category.TSE })
      stock.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(STOCK_SEARCH_BUT_NOT_GIVE_CODE)
      )
    })

    it('displays error when multiple mode but stock file missing', () => {
      vi.mocked(FilePath.stock.exist).mockReturnValue(false)

      const stock = new Stock('2330-2317', {
        listed: Category.TSE,
        multiple: true,
      })
      stock.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(STOCK_NOT_FOUND_FILE)
      )
    })

    it('displays error when favorite mode but favorite file missing', () => {
      vi.mocked(FilePath.favorite.exist).mockReturnValue(false)

      const stock = new Stock('', {
        listed: Category.TSE,
        favorite: true,
      })
      stock.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_NOT_FOUND)
      )
    })
  })

  describe('getStocks', () => {
    it('returns single stock with listed category', () => {
      const stock = new Stock('2330', { listed: Category.TSE })
      expect(stock.getStocks()).toEqual({
        stocks: '2330',
        listed: Category.TSE,
      })
    })

    it('splits multiple stocks by hyphen', () => {
      const stock = new Stock('2330-2317', {
        listed: Category.TSE,
        multiple: true,
      })
      expect(stock.getStocks()).toEqual({
        stocks: ['2330', '2317'],
      })
    })

    it('reads from favorite file when favorite option set', () => {
      vi.mocked(FilePath.favorite.read).mockReturnValue({
        stockCodes: ['2330', '2317'],
      })

      const stock = new Stock('', {
        listed: Category.TSE,
        favorite: true,
      })
      expect(stock.getStocks()).toEqual({
        stocks: ['2330', '2317'],
      })
    })
  })

  describe('getStockData', () => {
    it('returns msgArray when stat is OK', () => {
      const stock = new Stock('2330', { listed: Category.TSE })
      const data = { stat: 'OK', msgArray: [{ c: '2330' }] } as any

      expect(stock.getStockData(data)).toEqual([{ c: '2330' }])
    })

    it('returns stat string when stat is not OK', () => {
      const stock = new Stock('2330', { listed: Category.TSE })
      const data = { stat: 'ERROR', msgArray: [] } as any

      expect(stock.getStockData(data)).toBe('ERROR')
    })

    it('returns data array when data key exists', () => {
      const stock = new Stock('2330', { listed: Category.TSE })
      const data = { stat: 'OK', data: [['row1']] } as any

      expect(stock.getStockData(data)).toEqual([['row1']])
    })

    it('returns aaData when aaData key exists', () => {
      const stock = new Stock('2330', { listed: Category.TSE })
      const data = { aaData: [['row1']] } as any

      expect(stock.getStockData(data)).toEqual([['row1']])
    })
  })

  describe('getField', () => {
    it('returns history fields when date option is set', () => {
      const stock = new Stock('2330', {
        listed: Category.TSE,
        date: '202201',
      })
      const fields = stock.getField()
      expect(fields[0].name).toBe('日期')
    })

    it('returns stock index fields when type is index', () => {
      const stock = new Stock('2330', {
        listed: Category.TSE,
        type: 'index',
      })
      const fields = stock.getField()
      expect(fields[0].name).toBe('指數名稱')
    })

    it('returns basic fields by default', () => {
      const stock = new Stock('2330', { listed: Category.TSE })
      const fields = stock.getField()
      expect(fields[0].name).toBe('代號')
    })
  })

  describe('execute', () => {
    it('displays stock table on successful lookup', async () => {
      vi.mocked(getStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [
          {
            c: '2330',
            n: 'TSMC',
            z: '600',
            tv: '1000',
            v: '5000',
            y: '590',
            ex: Category.TSE,
          },
        ],
      } as any)

      const stock = new Stock('2330', { listed: Category.TSE, details: false })
      await stock.execute()

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('displays error when no stock found', async () => {
      vi.mocked(getStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      const stock = new Stock('9999', { listed: Category.TSE, details: false })
      await stock.execute()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(STOCK_NOT_FOUND)
      )
    })
  })
})
