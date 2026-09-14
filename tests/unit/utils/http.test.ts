import { requestJson } from '@/utils/http'

describe('requestJson', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
  it.each([
    { ok: false, status: 429 },
    {
      ok: true,
      json: async () => {
        throw new SyntaxError('Malformed JSON')
      },
    },
    {
      ok: true,
      json: async () => ({ rtcode: '5000', rtmessage: 'Unavailable' }),
    },
  ])(
    'rejects HTTP, JSON, and upstream failures with host context',
    async (response) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
      await expect(
        requestJson('https://example.com/data', { maxRetries: 0 })
      ).rejects.toThrow('Request failed for example.com/data')
    }
  )
  it('passes a bounded abort signal to fetch', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ value: 1 }) })
    vi.stubGlobal('fetch', fetchMock)
    await expect(requestJson('https://example.com/data')).resolves.toEqual({
      value: 1,
    })
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/data', {
      signal: expect.any(AbortSignal),
    })
  })

  it('aborts a response body that does not finish before the timeout', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 0)
      return controller.signal
    })
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: { signal: AbortSignal }) => ({
        ok: true,
        json: () =>
          new Promise((_, reject) => {
            options.signal.addEventListener('abort', () =>
              reject(new Error('The operation was aborted'))
            )
          }),
      }))
    )

    await expect(
      requestJson('https://example.com/data', { retryDelayMs: 0 })
    ).rejects.toThrow('Request failed for example.com/data')
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it.each([429, 500, 503])(
    'retries transient HTTP status %s and then succeeds',
    async (status) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({ ok: false, status })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ value: 1 }) })
      vi.stubGlobal('fetch', fetchMock)

      await expect(
        requestJson('https://example.com/data', { retryDelayMs: 0 })
      ).resolves.toEqual({ value: 1 })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    }
  )

  it('retries network failures but never retries deterministic 4xx responses', async () => {
    const networkFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: 1 }) })
    vi.stubGlobal('fetch', networkFetch)

    await expect(
      requestJson('https://example.com/data', { retryDelayMs: 0 })
    ).resolves.toEqual({ value: 1 })
    expect(networkFetch).toHaveBeenCalledTimes(2)

    const clientErrorFetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', clientErrorFetch)

    await expect(
      requestJson('https://example.com/data', { retryDelayMs: 0 })
    ).rejects.toThrow('HTTP 404')
    expect(clientErrorFetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry an upstream error returned in a valid HTTP response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rtcode: '5000', rtmessage: 'Unavailable' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      requestJson('https://example.com/data', { retryDelayMs: 0 })
    ).rejects.toThrow('Upstream error 5000: Unavailable')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('uses bounded exponential backoff through the injected sleep function', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
    const sleep = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      requestJson('https://example.com/data', { sleep })
    ).rejects.toThrow('after 3 attempts')
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenNthCalledWith(1, 250)
    expect(sleep).toHaveBeenNthCalledWith(2, 500)
  })
})
