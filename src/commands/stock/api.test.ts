import { getStock } from './api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

describe('getStock', () => {
  it('batches 51 mixed-market symbols and preserves order despite reversed replies', async () => {
    const codes = Array.from({ length: 51 }, (_, index) => String(1000 + index))
    mockFetch.mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => ({
        rtcode: '0000',
        msgArray: new URL(url).searchParams
          .get('ex_ch')!
          .split('|')
          .filter((ticker) => ticker.startsWith('tse_'))
          .reverse()
          .map((ticker) => ({ c: ticker.slice(4, -3), ex: 'tse' })),
      }),
    }))
    const query = codes
      .flatMap((code) => [`tse_${code}.tw`, `otc_${code}.tw`])
      .join('|')
    const result = await getStock(
      `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${query}|tse_1000.tw`
    )
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect('msgArray' in result && result.msgArray.map((row) => row.c)).toEqual(
      codes
    )
    for (const [url] of mockFetch.mock.calls)
      expect(
        new URL(url).searchParams.get('ex_ch')!.split('|').length
      ).toBeLessThanOrEqual(100)
  })

  it('retains successful batches and warns when a later batch fails', async () => {
    const warning = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ msgArray: [{ c: '1000', ex: 'tse' }] }),
      })
      .mockRejectedValueOnce(new Error('Offline'))
    const query = Array.from(
      { length: 101 },
      (_, index) => `tse_${1000 + index}.tw`
    ).join('|')
    const result = await getStock(
      `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${query}`
    )
    expect('msgArray' in result && result.msgArray).toHaveLength(1)
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('Some quote requests failed')
    )
    warning.mockRestore()
  })

  it('does not fetch an empty ex_ch query', async () => {
    await expect(
      getStock('https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=')
    ).resolves.toMatchObject({ msgArray: [] })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns parsed JSON on success', async () => {
    const mockData = { stat: 'OK', msgArray: [{ c: '2330' }] }
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await getStock('https://test.com')
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it('calls displayFailed on fetch error', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockFetch.mockRejectedValue(new Error('Network error'))

    await expect(getStock('https://test.com')).rejects.toThrow('Network error')
    spy.mockRestore()
  })
})
