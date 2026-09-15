import Fundamentals from '@/commands/fundamentals/handler'
import { getTwseOpenData } from '@/services/twse-openapi'

vi.mock('@/services/twse-openapi', async (loadOriginal) => ({
  ...(await loadOriginal<typeof import('@/services/twse-openapi')>()),
  getTwseOpenData: vi.fn(),
}))

it('renders valuation, revenue, and EPS', async () => {
  vi.mocked(getTwseOpenData)
    .mockResolvedValueOnce([
      {
        Date: '1150915',
        Code: '2330',
        Name: '台積電',
        PEratio: '25',
        DividendYield: '2',
        PBratio: '7',
      },
    ])
    .mockResolvedValueOnce([
      {
        公司代號: '2330',
        公司名稱: '台積電',
        資料年月: '11508',
        '營業收入-當月營收': '1000',
        '營業收入-去年同月增減(%)': '10',
      },
    ])
    .mockResolvedValueOnce([
      {
        公司代號: '2330',
        公司名稱: '台積電',
        年度: '115',
        季別: '2',
        '基本每股盈餘（元）': '20',
      },
    ])
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})

  await new Fundamentals('2330').execute()

  expect(log).toHaveBeenCalledWith(expect.stringContaining('本益比'))
  expect(log).toHaveBeenCalledWith(expect.stringContaining('20'))
  log.mockRestore()
})
