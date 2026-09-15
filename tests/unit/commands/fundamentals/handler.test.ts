import Fundamentals from '@/commands/fundamentals/handler'
import { getTwseOpenData } from '@/services/twse-openapi'
import { Category } from '@/types/stock'
import { requestJson } from '@/utils/http'

vi.mock('@/services/twse-openapi', async (loadOriginal) => ({
  ...(await loadOriginal<typeof import('@/services/twse-openapi')>()),
  getTwseOpenData: vi.fn(),
}))

vi.mock('@/utils/http', () => ({
  requestJson: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(getTwseOpenData).mockReset()
  vi.mocked(requestJson).mockReset()
})

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

it('renders TPEx fields, cumulative revenue, and YTD EPS', async () => {
  vi.mocked(requestJson)
    .mockResolvedValueOnce([
      {
        Date: '1150915',
        SecuritiesCompanyCode: '6547',
        CompanyName: '高端疫苗',
        PriceEarningRatio: '18',
        YieldRatio: '1.2',
        PriceBookRatio: '3',
      },
    ])
    .mockResolvedValueOnce([
      {
        公司代號: '6547',
        公司名稱: '高端疫苗',
        資料年月: '11508',
        '營業收入-當月營收': '1000',
        '營業收入-去年同月增減(%)': '10',
        '累計營業收入-當月累計營收': '9000',
        '累計營業收入-前期比較增減(%)': '20',
      },
    ])
    .mockResolvedValueOnce([
      {
        Date: '1150915',
        Year: '115',
        Season: '2',
        SecuritiesCompanyCode: '6547',
        CompanyName: '高端疫苗',
        '基本每股盈餘（元）': '2',
      },
      {
        Date: '1150915',
        Year: '115',
        Season: '1',
        SecuritiesCompanyCode: '6547',
        CompanyName: '高端疫苗',
        '基本每股盈餘（元）': '3',
      },
    ])
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})

  await new Fundamentals('6547', Category.OTC).execute()

  expect(requestJson).toHaveBeenCalledTimes(3)
  expect(requestJson).toHaveBeenCalledWith(
    expect.stringContaining('mopsfin_t187ap06_O_ci')
  )
  expect(log).toHaveBeenCalledWith(expect.stringContaining('9000'))
  expect(log).toHaveBeenCalledWith(expect.stringContaining('|       2       |'))
  log.mockRestore()
})

it('renders available data when one endpoint fails', async () => {
  vi.mocked(getTwseOpenData)
    .mockRejectedValueOnce(new Error('valuation down'))
    .mockResolvedValueOnce([
      { 公司代號: '2330', 公司名稱: '台積電', 資料年月: '11508' },
    ])
    .mockRejectedValue(new Error('income down'))
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})

  await new Fundamentals('2330').execute()

  expect(log).toHaveBeenCalledWith(expect.stringContaining('月營收'))
  log.mockRestore()
})

it('rejects malformed TPEx payloads while keeping other data', async () => {
  vi.mocked(requestJson)
    .mockResolvedValueOnce('malformed')
    .mockResolvedValueOnce([
      { 公司代號: '6547', 公司名稱: '高端疫苗', 資料年月: '11508' },
    ])
    .mockRejectedValue(new Error('income down'))
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const warning = vi.spyOn(console, 'error').mockImplementation(() => {})

  await new Fundamentals('6547', Category.OTC).execute()

  expect(warning).toHaveBeenCalled()
  expect(log).toHaveBeenCalledWith(expect.stringContaining('高端疫苗'))
  log.mockRestore()
  warning.mockRestore()
})

it('falls back from general industry EPS and validates integer periods', async () => {
  vi.mocked(getTwseOpenData)
    .mockResolvedValueOnce([{ Code: '2330', Name: '台積電', Date: '1150915' }])
    .mockResolvedValueOnce([
      { 公司代號: '2330', 公司名稱: '台積電', 資料年月: '11508' },
    ])
    .mockResolvedValueOnce([
      {
        公司代號: '2330',
        年度: '115.5',
        季別: '2',
        '基本每股盈餘（元）': '99',
      },
    ])
    .mockResolvedValueOnce([
      { 公司代號: '2330', 年度: '115', 季別: '2', '基本每股盈餘（元）': '4' },
    ])
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})

  await new Fundamentals('2330').execute()

  expect(getTwseOpenData).toHaveBeenCalledTimes(4)
  expect(getTwseOpenData).toHaveBeenLastCalledWith('opendata/t187ap06_L_basi')
  expect(log).toHaveBeenCalledWith(expect.stringContaining('基本 EPS (YTD)'))
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining('基本 EPS (YTD)  |      4')
  )
  expect(log.mock.calls[0][0]).not.toContain('99')
  log.mockRestore()
})
