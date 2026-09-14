import { getOHLC } from '@/commands/index/api'
import Indices from '@/commands/index/handler'
import { getStock as fetchStockData } from '@/commands/stock/api'
import { generateGetStockURL } from '@/commands/stock/utils'
import { STOCK_NOT_FOUND } from '@/messages/stock'
import { INDEX_USE_DATE_OPTIONS } from '@/messages/stock-index'
import { draw, filterDrawChartDataWithTwoTime } from '@/utils/chart'
import { getSelectedIndex } from '@/utils/prompt'

vi.mock('@/commands/index/api', () => ({
  getOHLC: vi.fn(),
}))

vi.mock('@/utils/prompt', () => ({
  getSelectedIndex: vi.fn(),
}))

vi.mock('@/utils/chart', () => ({
  draw: vi.fn(),
  filterDrawChartDataWithTwoTime: vi.fn(),
}))

vi.mock('@/commands/stock/api', () => ({
  getStock: vi.fn(),
}))

vi.mock('@/commands/stock/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/commands/stock/utils')>()
  return {
    ...actual,
    generateGetStockURL: vi.fn().mockReturnValue(''),
  }
})

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
  vi.clearAllMocks()
})

describe('Indices', () => {
  describe('chart mode', () => {
    it('draws chart after selecting index', async () => {
      vi.mocked(getSelectedIndex).mockResolvedValue('TSE' as any)
      vi.mocked(getOHLC).mockResolvedValue([
        { c: '100', ts: '0900' },
        { c: '101', ts: '0930' },
      ])

      const indices = new Indices('TAIEX', { chart: true })
      await indices.initialize()

      expect(getSelectedIndex).toHaveBeenCalled()
      expect(getOHLC).toHaveBeenCalledWith('TSE')
      expect(draw).toHaveBeenCalled()
    })

    it('filters data with time range when 2 times provided', async () => {
      vi.mocked(getSelectedIndex).mockResolvedValue('TSE' as any)
      vi.mocked(getOHLC).mockResolvedValue([{ c: '100', ts: '0900' }])
      vi.mocked(filterDrawChartDataWithTwoTime).mockReturnValue([
        { c: '100', ts: '0900' },
      ])

      const indices = new Indices('TAIEX', {
        chart: true,
        time: ['0900', '1100'] as any,
      })
      await indices.initialize()

      expect(filterDrawChartDataWithTwoTime).toHaveBeenCalled()
      expect(draw).toHaveBeenCalled()
    })

    it('displays a filter error when the chart range is invalid', async () => {
      vi.mocked(getSelectedIndex).mockResolvedValue('TSE' as any)
      vi.mocked(getOHLC).mockResolvedValue([{ c: '100', ts: '0900' }])
      vi.mocked(filterDrawChartDataWithTwoTime).mockReturnValue(
        'Invalid chart range' as any
      )

      await new Indices('TAIEX', {
        chart: true,
        time: ['1100', '0900'] as any,
      }).initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid chart range')
      )
      expect(draw).not.toHaveBeenCalled()
    })

    it('displays error when time has wrong number of values', async () => {
      vi.mocked(getSelectedIndex).mockResolvedValue('TSE' as any)
      vi.mocked(getOHLC).mockResolvedValue([])

      const indices = new Indices('TAIEX', {
        chart: true,
        time: '0900' as any,
      })
      await indices.initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(INDEX_USE_DATE_OPTIONS)
      )
    })

    it('does not draw when user cancels selection', async () => {
      vi.mocked(getSelectedIndex).mockResolvedValue(undefined as any)

      const indices = new Indices('TAIEX', { chart: true })
      await indices.initialize()

      expect(getOHLC).not.toHaveBeenCalled()
      expect(draw).not.toHaveBeenCalled()
    })
  })

  describe('index lookup', () => {
    it('fetches data for valid index code', async () => {
      vi.mocked(fetchStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      const indices = new Indices('TAIEX', { chart: false })
      await indices.initialize()

      expect(fetchStockData).toHaveBeenCalledWith(
        expect.stringContaining('tse_t00.tw')
      )
    })

    it('joins multiple index codes', async () => {
      vi.mocked(fetchStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      const indices = new Indices('TAIEX-TWO', {
        chart: false,
        multiple: true,
      })
      await indices.initialize()

      expect(fetchStockData).toHaveBeenCalledWith(
        expect.stringContaining('tse_t00.tw|otc_o00.tw')
      )
    })

    it('filters out invalid index codes and resolves unknown codes as stocks', async () => {
      vi.mocked(generateGetStockURL).mockResolvedValue('')
      vi.mocked(fetchStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      const indices = new Indices('TAIEX-INVALID', { chart: false })
      await indices.initialize()

      expect(generateGetStockURL).toHaveBeenCalledWith({
        stocks: ['INVALID'],
      })
      const calledUrl = vi.mocked(fetchStockData).mock.calls[0][0]
      expect(calledUrl).toContain('tse_t00.tw')
    })

    it('resolves regular stock codes via generateGetStockURL', async () => {
      vi.mocked(generateGetStockURL).mockResolvedValue('tse_2330.tw')
      vi.mocked(fetchStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      const indices = new Indices('2330', { chart: false })
      await indices.initialize()

      expect(generateGetStockURL).toHaveBeenCalledWith({
        stocks: ['2330'],
      })
      expect(fetchStockData).toHaveBeenCalledWith(
        expect.stringContaining('tse_2330.tw')
      )
    })

    it('combines indices and stock codes in mixed query', async () => {
      vi.mocked(generateGetStockURL).mockResolvedValue('tse_2330.tw')
      vi.mocked(fetchStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      const indices = new Indices('TAIEX-2330', { chart: false })
      await indices.initialize()

      const calledUrl = vi.mocked(fetchStockData).mock.calls[0][0]
      expect(calledUrl).toContain('tse_t00.tw')
      expect(calledUrl).toContain('tse_2330.tw')
    })

    it('skips the request when no index or stock ticker can be resolved', async () => {
      vi.mocked(generateGetStockURL).mockResolvedValue('')

      await new Indices('INVALID', { chart: false }).initialize()

      expect(fetchStockData).not.toHaveBeenCalled()
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('displays upstream index quote errors', async () => {
      vi.mocked(generateGetStockURL).mockResolvedValue('tse_t00.tw')
      vi.mocked(fetchStockData).mockResolvedValue({
        stat: 'ERROR',
        msgArray: [],
      } as any)

      await new Indices('TAIEX', { chart: false }).initialize()

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'))
    })

    it('reports an empty index quote response', async () => {
      vi.mocked(generateGetStockURL).mockResolvedValue('tse_t00.tw')
      vi.mocked(fetchStockData).mockResolvedValue({
        stat: 'OK',
        msgArray: [],
      } as any)

      await new Indices('TAIEX', { chart: false }).initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(STOCK_NOT_FOUND)
      )
    })
  })
})
