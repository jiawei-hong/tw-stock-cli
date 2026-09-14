import { getOHLC } from '@/commands/index/api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

describe('getOHLC', () => {
  it('returns ohlcArray from response', async () => {
    const mockOhlc = [{ c: '100', ts: '0900' }]
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ohlcArray: mockOhlc }),
    })

    const result = await getOHLC('tse')
    expect(result).toEqual(mockOhlc)
  })

  it('calls fetch with correct OHLC URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ohlcArray: [] }),
    })

    await getOHLC('tse')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://mis.twse.com.tw/stock//data/mis_ohlc_TSE.txt',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('retries a transient HTTP failure without a delay in tests', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ohlcArray: [] }),
      })

    await expect(getOHLC('tse', { retryDelayMs: 0 })).resolves.toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('rejects malformed OHLC payloads', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ohlcArray: [{ c: '100' }] }),
    })

    await expect(getOHLC('tse', { maxRetries: 0 })).rejects.toThrow(
      'Invalid OHLC response payload'
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
