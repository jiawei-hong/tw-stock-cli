import { getStock as getStockData } from '@/commands/stock/api'
import Stock from '@/commands/stock/handler'
import RealtimeStock from '@/commands/stock/realtime-handler'
import { extractStockData } from '@/commands/stock/response'
import SearchStock from '@/commands/stock/search-handler'
import { FAVORITE_NOT_FOUND } from '@/messages/favorite'
import {
  STOCK_NOT_FOUND,
  STOCK_SEARCH_BUT_NOT_GIVE_CODE,
} from '@/messages/stock'
import { searchSecurityDirectory } from '@/services/security-directory'
import { Category } from '@/types/stock'
import FilePath from '@/utils/file'

vi.mock('@/services/security-directory', () => ({
  searchSecurityDirectory: vi.fn(),
}))

vi.mock('@/utils/file', () => ({
  default: {
    favorite: {
      read: vi.fn(),
      write: vi.fn(),
      exist: vi.fn(),
    },
  },
}))

vi.mock('@/commands/stock/api', () => ({
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

    it('uses search mode when --search is provided', async () => {
      vi.mocked(searchSecurityDirectory).mockResolvedValue([
        {
          code: '2330',
          name: 'TSMC',
          category: Category.TSE,
          status: 'active',
        },
      ])

      const stock = new Stock(undefined, { search: '台積電' })
      stock.initialize()
      await vi.waitFor(() => expect(consoleSpy).toHaveBeenCalled())

      expect(searchSecurityDirectory).toHaveBeenCalledWith('台積電', undefined)
    })

    it('reports a missing search query clearly', () => {
      const stock = new Stock(undefined, { search: '' })
      stock.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('after --search')
      )
    })
  })

  describe('getStocks', () => {
    it('returns single stock with listed category', () => {
      const stock = new RealtimeStock('2330', { listed: Category.TSE })
      expect(stock.getStocks()).toEqual({
        stocks: '2330',
        listed: Category.TSE,
      })
    })

    it('splits multiple stocks by hyphen', () => {
      const stock = new RealtimeStock('2330-2317', {
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

      const stock = new RealtimeStock('', {
        listed: Category.TSE,
        favorite: true,
      })
      expect(stock.getStocks()).toEqual({
        stocks: ['2330', '2317'],
      })
    })

    it('reports an empty favorite list before requesting quotes', async () => {
      vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
      vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: [] })

      await new RealtimeStock('', { favorite: true }).execute()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('favorites list is empty')
      )
      expect(getStockData).not.toHaveBeenCalled()
    })
  })

  describe('extractStockData', () => {
    it('returns msgArray when stat is OK', () => {
      const data = { stat: 'OK', msgArray: [{ c: '2330' }] } as any
      expect(extractStockData(data)).toEqual([{ c: '2330' }])
    })

    it('returns stat string when stat is not OK', () => {
      const data = { stat: 'ERROR', msgArray: [] } as any
      expect(extractStockData(data)).toBe('ERROR')
    })

    it('returns data array when data key exists', () => {
      const data = { stat: 'OK', data: [['row1']] } as any
      expect(extractStockData(data)).toEqual([['row1']])
    })

    it('returns aaData when aaData key exists', () => {
      const data = { aaData: [['row1']] } as any
      expect(extractStockData(data)).toEqual([['row1']])
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

      const stock = new RealtimeStock('2330', {
        listed: Category.TSE,
        details: false,
      })
      await stock.execute()

      expect(consoleSpy).toHaveBeenCalled()
    })

    it('displays error when no stock found', async () => {
      vi.mocked(getStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      const stock = new RealtimeStock('9999', {
        listed: Category.TSE,
        details: false,
      })
      await stock.execute()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(STOCK_NOT_FOUND)
      )
    })

    it('explains that an unknown code can be checked with search', async () => {
      vi.mocked(getStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      await new RealtimeStock('9999', {}).execute()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No current quote matched "9999" on TSE or OTC')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('tw-stock stock --search 9999')
      )
    })

    it('preserves upstream errors while adding symbol guidance', async () => {
      vi.mocked(getStockData).mockResolvedValue({
        stat: 'ERROR',
        msgArray: [],
      } as any)

      await new RealtimeStock('2330', { listed: Category.TSE }).execute()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR No current quote matched "2330" on TSE')
      )
    })
  })
})

describe('SearchStock', () => {
  it('renders code, name, and market for matching securities', async () => {
    vi.mocked(searchSecurityDirectory).mockResolvedValue([
      {
        code: '2330',
        name: 'TSMC',
        category: Category.TSE,
        status: 'active',
      },
    ])

    await new SearchStock('2330', {}).execute()

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('TSMC'))
    expect(searchSecurityDirectory).toHaveBeenCalledWith('2330', undefined)
  })

  it('suggests a broader search when no securities match', async () => {
    vi.mocked(searchSecurityDirectory).mockResolvedValue([])

    await new SearchStock('unknown', {}).execute()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No active stocks matched "unknown"')
    )
  })
})
