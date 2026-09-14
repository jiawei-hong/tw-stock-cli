import { getMarketSymbols } from '@/services/market-symbols'

describe('getMarketSymbols', () => {
  const mockFetch = vi.fn()
  beforeEach(() => {
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('resolves names without requiring a trade and ignores unrelated rows', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        rtcode: '0000',
        msgArray: [
          { c: '', z: '-' },
          { c: '00679B', ex: 'otc', n: ' Bond ETF ', z: '-' },
          { c: '2330', ex: 'tse', n: 'TSMC' },
        ],
      }),
    })
    await expect(getMarketSymbols(['00679b', '00679B'])).resolves.toEqual({
      '00679B': { name: 'Bond ETF', category: 'otc' },
    })
    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch.mock.calls[0][0]).toContain('tse_00679B.tw|otc_00679B.tw')
  })

  it('does not make a request for empty favorites', async () => {
    await expect(getMarketSymbols([])).resolves.toEqual({})
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('splits large lists into bounded requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ rtcode: '0000', msgArray: [] }),
    })
    await getMarketSymbols(
      Array.from({ length: 51 }, (_, index) => `${1000 + index}`)
    )
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it.each([
    { ok: false, status: 503 },
    { ok: true, json: async () => ({ rtcode: '5000', msgArray: [] }) },
    { ok: true, json: async () => ({ rtcode: '0000' }) },
  ])('rejects failed or invalid upstream responses', async (response) => {
    mockFetch.mockResolvedValue(response)
    await expect(getMarketSymbols(['2330'])).rejects.toThrow(/mis/i)
  })
})
