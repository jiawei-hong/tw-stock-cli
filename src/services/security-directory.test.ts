import { Category } from '@/types/stock'

import {
  getSecurityDirectory,
  parseSecurityDirectory,
  resetSecurityDirectoryCache,
} from './security-directory'

const listedRecord = {
  證券代號: '0050',
  證券名稱: 'ETF',
  市場別: '上市',
  證券狀態: '正常',
}
const expectedDirectory = {
  '0050': { name: 'ETF', category: Category.TSE },
}

describe('parseSecurityDirectory', () => {
  it('preserves leading zeros and normalizes BOM keys and alphanumeric codes', () => {
    expect(
      parseSecurityDirectory([
        listedRecord,
        {
          '\ufeff證券代號': ' 00679b ',
          證券名稱: ' Bond ETF ',
          市場別: '上櫃',
          證券狀態: '正常',
        },
      ])
    ).toEqual({
      ...expectedDirectory,
      '00679B': { name: 'Bond ETF', category: Category.OTC },
    })
  })

  it('excludes unsupported markets, inactive securities, and malformed rows', () => {
    expect(
      parseSecurityDirectory([
        listedRecord,
        ...['興櫃', '未上市櫃', '終止上市櫃'].map((market) => ({
          ...listedRecord,
          證券代號: '9999',
          市場別: market,
        })),
        ...['暫停交易', '下市櫃', '停止帳簿劃撥', '未知'].map((status) => ({
          ...listedRecord,
          證券代號: '9999',
          證券狀態: status,
        })),
        { ...listedRecord, 證券代號: 2330 },
        { ...listedRecord, 證券名稱: '' },
        null,
        {},
        'invalid',
      ])
    ).toEqual(expectedDirectory)
  })

  it.each([null, {}, [], [{ 市場別: '上市' }]])(
    'rejects unusable directory data: %j',
    (payload) => {
      expect(() => parseSecurityDirectory(payload)).toThrow(/TDCC/)
    }
  )
})

describe('getSecurityDirectory', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    resetSecurityDirectoryCache()
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    resetSecurityDirectoryCache()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  function respondSuccessfully() {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [listedRecord],
    })
  }

  it('shares one download between concurrent and subsequent callers', async () => {
    respondSuccessfully()
    const results = await Promise.all([
      getSecurityDirectory(),
      getSecurityDirectory(),
    ])
    expect(results).toEqual([expectedDirectory, expectedDirectory])
    await expect(getSecurityDirectory()).resolves.toEqual(expectedDirectory)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it.each(['network', 'http', 'json', 'schema'])(
    'allows retry after a %s failure',
    async (failure) => {
      if (failure === 'network') {
        mockFetch.mockRejectedValueOnce(new Error('Network unavailable'))
      } else {
        mockFetch.mockResolvedValueOnce({
          ok: failure !== 'http',
          status: 503,
          json: async () => {
            if (failure === 'json') throw new SyntaxError('Invalid JSON')
            return []
          },
        })
      }
      await expect(getSecurityDirectory()).rejects.toThrow()
      respondSuccessfully()
      await expect(getSecurityDirectory()).resolves.toEqual(expectedDirectory)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    }
  )

  it('aborts a stalled download and permits a later retry', async () => {
    vi.useFakeTimers()
    mockFetch.mockImplementationOnce(
      (_url: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason))
        })
    )
    const failure = expect(getSecurityDirectory()).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(30_000)
    await failure
    respondSuccessfully()
    await expect(getSecurityDirectory()).resolves.toEqual(expectedDirectory)
    expect(vi.getTimerCount()).toBe(0)
  })
})
