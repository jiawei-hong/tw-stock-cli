import { fetchRankData } from './api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  mockFetch.mockReset()
})

describe('fetchRankData', () => {
  it('returns parsed JSON on success', async () => {
    const mockData = { stat: 'OK', tables: [] }
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(mockData),
    })

    const result = await fetchRankData('https://test.com')
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith('https://test.com')
  })

  it('calls displayFailed on fetch error', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockFetch.mockRejectedValue(new Error('Network error'))

    await fetchRankData('https://test.com')
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Failure:'))
    spy.mockRestore()
  })
})
