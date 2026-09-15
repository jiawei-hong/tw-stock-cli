import { table } from 'table'

import { formatRocDate, getTwseOpenData } from '@/services/twse-openapi'
import { tableConfig } from '@/utils/table'
import { displayFailed } from '@/utils/text'

type Holiday = { Name: string; Date: string; Description: string }
type Dividend = {
  Date: string
  Code: string
  Name: string
  Exdividend: string
  CashDividend: string
  StockDividendRatio: string
}
type Disposition = {
  Code: string
  Name: string
  DispositionPeriod: string
  ReasonsOfDisposition: string
  DispositionMeasures: string
}
type Notice = {
  Code: string
  Name: string
  Date: string
  TradingInfoForAttention: string
}
type TradingHalt = {
  Code: string
  Name: string
  TradingHaltDate: string
  TradingResumptionDate: string
}

class Events {
  constructor(private code?: string, private month?: string) {}

  initialize(): Promise<void> {
    return this.execute().catch((error) => displayFailed(String(error)))
  }

  async execute(): Promise<void> {
    const [holidays, dividends, dispositions, notices, tradingHalts] =
      await Promise.all([
        getTwseOpenData<Holiday>('holidaySchedule/holidaySchedule'),
        getTwseOpenData<Dividend>('exchangeReport/TWT48U_ALL'),
        getTwseOpenData<Disposition>('announcement/punish'),
        getTwseOpenData<Notice>('announcement/notice'),
        getTwseOpenData<TradingHalt>('exchangeReport/TWTAWU'),
      ])
    const month = this.month
    const code = this.code?.toUpperCase()
    const rows = [
      ...holidays
        .filter((item) => !month || formatRocDate(item.Date).startsWith(month))
        .map((item) => [formatRocDate(item.Date), '休市', '-', item.Name]),
      ...dividends
        .filter(
          (item) =>
            (!code || item.Code === code) &&
            (!month || formatRocDate(item.Date).startsWith(month))
        )
        .map((item) => [
          formatRocDate(item.Date),
          `除${item.Exdividend}`,
          item.Code,
          `${item.Name} 現金 ${item.CashDividend || '-'} 股票 ${
            item.StockDividendRatio || '-'
          }`,
        ]),
      ...dispositions
        .filter((item) => !code || item.Code === code)
        .map((item) => [
          item.DispositionPeriod,
          '處置',
          item.Code,
          `${item.Name} ${item.DispositionMeasures}: ${item.ReasonsOfDisposition}`,
        ]),
      ...notices
        .filter((item) => item.Code && (!code || item.Code === code))
        .map((item) => [
          formatRocDate(item.Date),
          '注意',
          item.Code,
          `${item.Name} ${item.TradingInfoForAttention || '-'}`,
        ]),
      ...tradingHalts
        .filter((item) => !code || item.Code === code)
        .map((item) => [
          `${formatRocDate(item.TradingHaltDate)}～${formatRocDate(
            item.TradingResumptionDate
          )}`,
          '暫停',
          item.Code,
          item.Name,
        ]),
    ].sort((left, right) => left[0].localeCompare(right[0]))

    console.log(
      table([['日期／期間', '類型', '代號', '內容'], ...rows], tableConfig)
    )
  }
}

export default Events
