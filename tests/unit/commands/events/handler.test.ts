import Events from '@/commands/events/handler'
import { getTwseOpenData } from '@/services/twse-openapi'

vi.mock('@/services/twse-openapi', async (loadOriginal) => ({
  ...(await loadOriginal<typeof import('@/services/twse-openapi')>()),
  getTwseOpenData: vi.fn(),
}))

vi.mock('@/commands/events/api', () => ({
  getTpexOpenData: vi.fn(),
}))

it('renders matching market events', async () => {
  vi.mocked(getTwseOpenData)
    .mockResolvedValueOnce([
      { Name: '中秋節', Date: '1150925', Description: '休市' },
    ])
    .mockResolvedValueOnce([
      {
        Date: '1150918',
        Code: '2330',
        Name: '台積電',
        Exdividend: '息',
        CashDividend: '5',
        StockDividendRatio: '',
      },
    ])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})

  await new Events('2330', '2026-09').execute()

  expect(log).toHaveBeenCalledWith(expect.stringContaining('台積電'))
  expect(log).toHaveBeenCalledWith(expect.stringContaining('中秋節'))
  log.mockRestore()
})

it('includes ranges overlapping the requested month and month end dates', async () => {
  vi.mocked(getTwseOpenData)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      {
        Code: '2330',
        Name: '台積電',
        DispositionPeriod: '115/08/28～115/09/05',
        ReasonsOfDisposition: '測試',
        DispositionMeasures: '測試',
      },
    ])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      {
        Code: '2330',
        Name: '台積電',
        TradingHaltDate: '1151031',
        TradingResumptionDate: '1151102',
      },
    ])
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})

  await new Events('2330', '2026-09').execute()
  expect(log).toHaveBeenCalledWith(expect.stringContaining('測試'))
  log.mockClear()

  vi.mocked(getTwseOpenData).mockReset()
  vi.mocked(getTwseOpenData)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      {
        Code: '2330',
        Name: '台積電',
        TradingHaltDate: '1151031',
        TradingResumptionDate: '1151102',
      },
    ])
  await new Events('2330', '2026-10').execute()
  expect(log).toHaveBeenCalledWith(expect.stringContaining('2026-10-31'))
  log.mockRestore()
})

it('throws when every event dataset fails', async () => {
  vi.mocked(getTwseOpenData).mockRejectedValue(new Error('offline'))

  await expect(new Events(undefined, '2026-09').execute()).rejects.toThrow(
    'all events datasets unavailable'
  )
})
