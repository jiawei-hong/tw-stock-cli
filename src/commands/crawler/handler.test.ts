import { CRAWLER_STOCK_FILE_CREATED } from '@/messages/crawler'
import FilePath from '@/utils/file'

import Crawler from './handler'

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

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
  mockFetch.mockReset()
  vi.clearAllMocks()
})

function createMockResponse(html: string) {
  const encoder = new TextEncoder()
  const buffer = encoder.encode(html).buffer
  return {
    arrayBuffer: () => Promise.resolve(buffer),
  }
}

describe('Crawler', () => {
  it('creates a crawler with TSE and OTC URLs', () => {
    const crawler = new Crawler()
    expect(crawler.urls.tse).toContain('strMode=2')
    expect(crawler.urls.otc).toContain('strMode=4')
  })

  it('crawls and writes stock data', async () => {
    const html = `
      <table>
        <tr><td>2330 TSMC</td></tr>
        <tr><td>2317 Foxconn</td></tr>
      </table>
    `
    mockFetch.mockResolvedValue(createMockResponse(html))

    const crawler = new Crawler()
    await crawler.execute()

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(FilePath.stock.write).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(CRAWLER_STOCK_FILE_CREATED)
    )
  })

  it('filters out rows with empty strings', async () => {
    const html = '<table><tr><td>2330 TSMC</td></tr><tr><td> </td></tr></table>'
    mockFetch.mockResolvedValue(createMockResponse(html))

    const crawler = new Crawler()
    await crawler.execute()

    const writeCall = vi.mocked(FilePath.stock.write).mock
      .calls[0][0] as Record<string, any>
    const keys = Object.keys(writeCall)
    expect(keys.every((k) => k.length > 0)).toBe(true)
  })

  it('parses stocks from both TSE and OTC', async () => {
    const tseHtml = '<table><tr><td>2330 TSMC</td></tr></table>'
    const otcHtml = '<table><tr><td>6488 Global</td></tr></table>'

    mockFetch
      .mockResolvedValueOnce(createMockResponse(tseHtml))
      .mockResolvedValueOnce(createMockResponse(otcHtml))

    const crawler = new Crawler()
    await crawler.execute()

    const writeCall = vi.mocked(FilePath.stock.write).mock
      .calls[0][0] as Record<string, any>
    expect(writeCall['2330']).toEqual({ name: 'TSMC', category: 'tse' })
    expect(writeCall['6488']).toEqual({ name: 'Global', category: 'otc' })
  })
})
