import { fetchRankData } from '@/commands/rank/api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

describe('fetchRankData', () => {
  it('returns parsed JSON on success', async () => {
    const mockData = { stat: 'OK', tables: [] }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await fetchRankData('https://test.com')
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('calls displayFailed on fetch error', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(
      fetchRankData('https://test.com', { retryDelayMs: 0 })
    ).rejects.toThrow('Network error')
    spy.mockRestore()
  })

  it('retries a transient HTTP failure without a delay in tests', async () => {
    const mockData = { stat: 'OK', tables: [] }
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      })

    await expect(
      fetchRankData('https://test.com', { retryDelayMs: 0 })
    ).resolves.toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('accepts the real TWSE shape, which ends with an empty table', async () => {
    const mockData = {
      stat: 'OK',
      tables: [
        { title: '價格指數', fields: [], data: [] },
        { title: '每日收盤行情', fields: [], data: [] },
        {},
      ],
    }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    await expect(fetchRankData('https://test.com')).resolves.toEqual(mockData)
  })

  it('passes a no-trading-day answer through so it is reported as not found', async () => {
    const mockData = { stat: '很抱歉，沒有符合條件的資料!', type: 'ALLBUT0999' }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    await expect(fetchRankData('https://test.com')).resolves.toEqual(mockData)
  })

  it('rejects an OK payload whose tables have no data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stat: 'OK', tables: [{}, {}] }),
    })

    await expect(
      fetchRankData('https://test.com', { maxRetries: 0 })
    ).rejects.toThrow('Invalid rank response payload')
  })

  it('rejects malformed payloads without retrying', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stat: 'OK' }),
    })

    await expect(
      fetchRankData('https://test.com', { maxRetries: 0 })
    ).rejects.toThrow('Invalid rank response payload')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry deterministic HTTP failures', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400 })

    await expect(
      fetchRankData('https://test.com', { retryDelayMs: 0 })
    ).rejects.toThrow('HTTP 400')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
