import Events from '@/commands/events/handler'
import { getTwseOpenData } from '@/services/twse-openapi'

vi.mock('@/services/twse-openapi', async (loadOriginal) => ({
  ...(await loadOriginal<typeof import('@/services/twse-openapi')>()),
  getTwseOpenData: vi.fn(),
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
