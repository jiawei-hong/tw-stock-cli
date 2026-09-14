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
