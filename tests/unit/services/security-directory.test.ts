import {
  getSecurityDirectory,
  getSecurityRecords,
  parseSecurityDirectory,
  parseSecurityRecords,
  resetSecurityDirectoryCache,
  searchSecurityDirectory,
  SECURITY_DIRECTORY_CACHE_TTL_MS,
  TDCC_TIMEOUT_MS,
} from '@/services/security-directory'
import { Category } from '@/types/stock'

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

  it('keeps same-code securities from both markets for discovery', () => {
    expect(
      parseSecurityRecords([
        listedRecord,
        {
          證券代號: '0050',
          證券名稱: 'ETF50 OTC',
          市場別: '上櫃',
          證券狀態: '正常',
        },
      ])
    ).toEqual([
      {
        code: '0050',
        name: 'ETF',
        category: Category.TSE,
        status: 'active',
      },
      {
        code: '0050',
        name: 'ETF50 OTC',
        category: Category.OTC,
        status: 'active',
      },
    ])
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
    vi.restoreAllMocks()
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

  it('refreshes the directory after the cache TTL expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-15T00:00:00Z'))
    respondSuccessfully()

    await expect(getSecurityDirectory()).resolves.toEqual(expectedDirectory)
    await vi.advanceTimersByTimeAsync(SECURITY_DIRECTORY_CACHE_TTL_MS + 1)
    await expect(getSecurityDirectory()).resolves.toEqual(expectedDirectory)

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('shares the downloaded records with search callers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        listedRecord,
        {
          證券代號: '0050',
          證券名稱: 'ETF50 OTC',
          市場別: '上櫃',
          證券狀態: '正常',
        },
        {
          證券代號: '2330',
          證券名稱: '台積電',
          市場別: '上市',
          證券狀態: '正常',
        },
      ],
    })

    await expect(getSecurityRecords()).resolves.toHaveLength(3)
    await expect(searchSecurityDirectory('0050')).resolves.toEqual([
      expect.objectContaining({ code: '0050', category: Category.TSE }),
      expect.objectContaining({ code: '0050', category: Category.OTC }),
    ])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('ranks exact, prefix, and contains matches deterministically', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          證券代號: '2330',
          證券名稱: '台積電',
          市場別: '上市',
          證券狀態: '正常',
        },
        {
          證券代號: '2331',
          證券名稱: '台積電二',
          市場別: '上市',
          證券狀態: '正常',
        },
        {
          證券代號: '1233',
          證券名稱: '其他台積電供應商',
          市場別: '上櫃',
          證券狀態: '正常',
        },
      ],
    })

    await expect(searchSecurityDirectory('台積電')).resolves.toEqual([
      expect.objectContaining({ code: '2330' }),
      expect.objectContaining({ code: '2331' }),
      expect.objectContaining({ code: '1233' }),
    ])
  })

  it('returns no matches for an empty or unknown query', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [listedRecord],
    })

    await expect(searchSecurityDirectory('')).resolves.toEqual([])
    await expect(searchSecurityDirectory('not-found')).resolves.toEqual([])
  })

  it.each(['network', '429', '5xx'])(
    'retries transient %s failures without a delay in tests',
    async (failure) => {
      if (failure === 'network') {
        mockFetch.mockRejectedValueOnce(new Error('Network unavailable'))
      } else {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: failure === '429' ? 429 : 503,
        })
      }
      respondSuccessfully()
      await expect(getSecurityDirectory({ retryDelayMs: 0 })).resolves.toEqual(
        expectedDirectory
      )
      expect(mockFetch).toHaveBeenCalledTimes(2)
    }
  )

  it.each(['json', 'schema'])(
    'does not retry malformed %s responses',
    async (failure) => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          if (failure === 'json') throw new SyntaxError('Invalid JSON')
          return []
        },
      })

      await expect(getSecurityDirectory({ retryDelayMs: 0 })).rejects.toThrow(
        failure === 'json' ? 'Invalid JSON' : /TDCC/
      )
      expect(mockFetch).toHaveBeenCalledTimes(1)
    }
  )

  it('does not retry deterministic HTTP failures', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400 })

    await expect(getSecurityDirectory({ retryDelayMs: 0 })).rejects.toThrow(
      'HTTP 400'
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('retries a stalled download after the shared timeout', async () => {
    vi.useFakeTimers()
    vi.spyOn(AbortSignal, 'timeout').mockImplementation((delay) => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), delay)
      return controller.signal
    })
    mockFetch
      .mockImplementationOnce(
        (_url: string, { signal }: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason))
          })
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [listedRecord],
      })
    const result = getSecurityDirectory({ retryDelayMs: 0 })
    await vi.advanceTimersByTimeAsync(TDCC_TIMEOUT_MS)
    await expect(result).resolves.toEqual(expectedDirectory)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
