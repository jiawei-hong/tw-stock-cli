import { getOHLC } from './api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

describe('getOHLC', () => {
  it('returns ohlcArray from response', async () => {
    const mockOhlc = [{ c: '100', ts: '0900' }]
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ohlcArray: mockOhlc }),
    })

    const result = await getOHLC('tse')
    expect(result).toEqual(mockOhlc)
  })

  it('calls fetch with correct OHLC URL', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ ohlcArray: [] }),
    })

    await getOHLC('tse')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://mis.twse.com.tw/stock//data/mis_ohlc_TSE.txt'
    )
  })
})
