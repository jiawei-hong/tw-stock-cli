import { requestJson } from './http'

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
      await expect(requestJson('https://example.com/data')).rejects.toThrow(
        'Request failed for example.com'
      )
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

    await expect(requestJson('https://example.com/data')).rejects.toThrow(
      'Request failed for example.com'
    )
  })
})
