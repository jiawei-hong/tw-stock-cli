import { formatRocDate, getTwseOpenData } from '@/services/twse-openapi'
import { Category } from '@/types/stock'
import { responsiveTable } from '@/utils/table'
import { displayFailed, displayWarning } from '@/utils/text'

import { getTpexOpenData } from './api'

type Market = Category.TSE | Category.OTC
type Row = [string, string, string, string]
type Holiday = { Name: string; Date: string; Description: string }
type TseDividend = {
  Date: string
  Code: string
  Name: string
  Exdividend: string
  CashDividend: string
  StockDividendRatio: string
}
type TseDisposition = {
  Code: string
  Name: string
  DispositionPeriod: string
  ReasonsOfDisposition: string
  DispositionMeasures: string
}
type TseNotice = {
  Code: string
  Name: string
  Date: string
  TradingInfoForAttention: string
}
type TseHalt = {
  Code: string
  Name: string
  TradingHaltDate: string
  TradingResumptionDate: string
}
type TpexDividend = {
  ExRrightsExDividendDate: string
  SecuritiesCompanyCode: string
  CompanyName: string
  ExRrightsExDividend: string
  CashDividend: string
  StockDividendRatio: string
}
type TpexDisposition = {
  SecuritiesCompanyCode: string
  CompanyName: string
  DispositionPeriod: string
  DispositionReasons: string
  DisposalCondition: string
}
type TpexNotice = {
  Date: string
  SecuritiesCompanyCode: string
  CompanyName: string
  TradingInformation: string
}
type TpexHalt = {
  SecuritiesCompanyCode: string
  CompanyName: string
  DateOfSuspendedTrading: string
  DateOfResumedTrading: string
}

const TSE_PATHS = [
  'holidaySchedule/holidaySchedule',
  'exchangeReport/TWT48U_ALL',
  'announcement/punish',
  'announcement/notice',
  'exchangeReport/TWTAWU',
] as const
const TPEX_PATHS = [
  'tpex_exright_prepost',
  'tpex_disposal_information',
  'tpex_trading_warning_information',
  'tpex_spendi_history',
] as const
const TSE_FIELDS = [
  ['Name', 'Date', 'Description'],
  ['Date', 'Code', 'Name', 'Exdividend', 'CashDividend', 'StockDividendRatio'],
  [
    'Code',
    'Name',
    'DispositionPeriod',
    'ReasonsOfDisposition',
    'DispositionMeasures',
  ],
  ['Code', 'Name', 'Date', 'TradingInfoForAttention'],
  ['Code', 'Name', 'TradingHaltDate', 'TradingResumptionDate'],
] as const
const TPEX_FIELDS = [
  ['Name', 'Date', 'Description'],
  [
    'ExRrightsExDividendDate',
    'SecuritiesCompanyCode',
    'CompanyName',
    'ExRrightsExDividend',
    'CashDividend',
    'StockDividendRatio',
  ],
  [
    'SecuritiesCompanyCode',
    'CompanyName',
    'DispositionPeriod',
    'DispositionReasons',
    'DisposalCondition',
  ],
  ['Date', 'SecuritiesCompanyCode', 'CompanyName', 'TradingInformation'],
  [
    'SecuritiesCompanyCode',
    'CompanyName',
    'DateOfSuspendedTrading',
    'DateOfResumedTrading',
  ],
] as const

function codeValue(code: string | undefined): string | undefined {
  if (code === undefined) return undefined
  const value = code.trim().toUpperCase()
  if (!/^[A-Z0-9]{4,6}$/.test(value))
    throw new Error('stock code must contain 4 to 6 letters or digits')
  return value
}

function monthValue(month: string | undefined): string | undefined {
  if (month !== undefined && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
    throw new Error('month must use YYYY-MM format')
  return month
}

function dateKey(value: string): string | undefined {
  const compact = value.replaceAll('/', '').trim()
  if (!/^\d{7}$/.test(compact)) return undefined
  return `${Number(compact.slice(0, 3)) + 1911}-${compact.slice(
    3,
    5
  )}-${compact.slice(5)}`
}

function dates(value: string): [string, string | undefined] {
  const values = value.match(/\d{3}\/?\d{2}\/?\d{2}/g) ?? []
  return [values[0] ?? '', values[1]]
}

function overlaps(
  value: string,
  end: string | undefined,
  month: string | undefined
): boolean {
  if (!month) return true
  const start = dateKey(value)
  if (!start) return false
  const finish = dateKey(end ?? value) ?? start
  const monthStart = `${month}-01`
  const monthEnd = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)
  )
    .toISOString()
    .slice(0, 10)
  return start <= monthEnd && finish >= monthStart
}

function displayDate(value: string | undefined): string {
  return value ? formatRocDate(value.replaceAll('/', '')) : '-'
}

function matches(itemCode: string, code: string | undefined): boolean {
  return !code || itemCode.trim().toUpperCase() === code
}

function holidayType(item: Holiday): string {
  if (/開始交易|最後交易/.test(item.Name) && !/無交易/.test(item.Description)) {
    return '開市'
  }
  if (/無交易|放假/.test(item.Description)) return '休市'
  return '日曆'
}

function holidayContent(item: Holiday): string {
  const description = item.Description.replace(/<br\s*\/?>(\s*)/gi, ' ').trim()
  return description ? `${item.Name} ${description}` : item.Name
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validDataset(
  value: unknown[] | undefined,
  fields: readonly string[],
  label: string
): unknown[] | undefined {
  if (
    !value ||
    !value.every(
      (item) =>
        isRecord(item) &&
        fields.every((field) => typeof item[field] === 'string')
    )
  ) {
    displayWarning(`events dataset ${label} has an invalid record`)
    return undefined
  }
  return value
}

class Events {
  constructor(
    private code?: string,
    private month?: string,
    private market: Market = Category.TSE
  ) {}

  initialize(): Promise<void> {
    return this.execute().catch((error) => displayFailed(String(error)))
  }

  async execute(): Promise<void> {
    const code = codeValue(this.code)
    const month = monthValue(this.month)
    if (this.market !== Category.TSE && this.market !== Category.OTC)
      throw new Error('market must be tse or otc')

    const requests =
      this.market === Category.TSE
        ? TSE_PATHS.map((path) => getTwseOpenData<unknown>(path))
        : [
            getTwseOpenData<Holiday>(TSE_PATHS[0]),
            ...TPEX_PATHS.map((path) => getTpexOpenData<unknown>(path)),
          ]
    const results = await Promise.allSettled(requests)
    const data: unknown[][] = []
    let failed = 0
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const fields =
          this.market === Category.TSE ? TSE_FIELDS[index] : TPEX_FIELDS[index]
        const valid = validDataset(result.value, fields, String(index + 1))
        if (valid) data[index] = valid
        else failed += 1
      } else {
        failed += 1
        displayWarning(
          `events dataset ${index + 1} unavailable: ${String(result.reason)}`
        )
      }
    })
    if (failed === results.length)
      throw new Error('all events datasets unavailable')

    const rows: Row[] = ((data[0] ?? []) as Holiday[])
      .filter((item) => overlaps(item.Date, undefined, month))
      .map((item) => [
        displayDate(item.Date),
        holidayType(item),
        '-',
        holidayContent(item),
      ])
    rows.push(
      ...(this.market === Category.TSE
        ? this.tseRows(data, code, month)
        : this.tpexRows(data, code, month))
    )
    rows.sort((left, right) => left[0].localeCompare(right[0]))
    console.log(
      responsiveTable([['日期／期間', '類型', '代號', '內容'], ...rows], 3)
    )
  }

  private tseRows(
    data: unknown[][],
    code: string | undefined,
    month: string | undefined
  ): Row[] {
    const dividends = (data[1] ?? []) as TseDividend[]
    const dispositions = (data[2] ?? []) as TseDisposition[]
    const notices = (data[3] ?? []) as TseNotice[]
    const halts = (data[4] ?? []) as TseHalt[]
    return [
      ...dividends
        .filter(
          (item) =>
            matches(item.Code, code) && overlaps(item.Date, undefined, month)
        )
        .map(
          (item): Row => [
            displayDate(item.Date),
            `除${item.Exdividend}`,
            item.Code,
            `${item.Name} 現金 ${item.CashDividend || '-'} 股票 ${
              item.StockDividendRatio || '-'
            }`,
          ]
        ),
      ...dispositions
        .filter((item) => {
          const [start, end] = dates(item.DispositionPeriod)
          return matches(item.Code, code) && overlaps(start, end, month)
        })
        .map(
          (item): Row => [
            item.DispositionPeriod,
            '處置',
            item.Code,
            `${item.Name} ${item.DispositionMeasures}: ${item.ReasonsOfDisposition}`,
          ]
        ),
      ...notices
        .filter(
          (item) =>
            item.Code &&
            matches(item.Code, code) &&
            overlaps(item.Date, undefined, month)
        )
        .map(
          (item): Row => [
            displayDate(item.Date),
            '注意',
            item.Code,
            `${item.Name} ${item.TradingInfoForAttention || '-'}`,
          ]
        ),
      ...halts
        .filter(
          (item) =>
            matches(item.Code, code) &&
            overlaps(item.TradingHaltDate, item.TradingResumptionDate, month)
        )
        .map(
          (item): Row => [
            `${displayDate(item.TradingHaltDate)}～${displayDate(
              item.TradingResumptionDate
            )}`,
            '暫停',
            item.Code,
            item.Name,
          ]
        ),
    ]
  }

  private tpexRows(
    data: unknown[][],
    code: string | undefined,
    month: string | undefined
  ): Row[] {
    const dividends = (data[1] ?? []) as TpexDividend[]
    const dispositions = (data[2] ?? []) as TpexDisposition[]
    const notices = (data[3] ?? []) as TpexNotice[]
    const halts = (data[4] ?? []) as TpexHalt[]
    return [
      ...dividends
        .filter(
          (item) =>
            matches(item.SecuritiesCompanyCode, code) &&
            overlaps(item.ExRrightsExDividendDate, undefined, month)
        )
        .map(
          (item): Row => [
            displayDate(item.ExRrightsExDividendDate),
            `除${item.ExRrightsExDividend}`,
            item.SecuritiesCompanyCode,
            `${item.CompanyName} 現金 ${item.CashDividend || '-'} 股票 ${
              item.StockDividendRatio || '-'
            }`,
          ]
        ),
      ...dispositions
        .filter((item) => {
          const [start, end] = dates(item.DispositionPeriod)
          return (
            matches(item.SecuritiesCompanyCode, code) &&
            overlaps(start, end, month)
          )
        })
        .map(
          (item): Row => [
            item.DispositionPeriod,
            '處置',
            item.SecuritiesCompanyCode,
            `${item.CompanyName}: ${
              item.DispositionReasons || item.DisposalCondition
            }`,
          ]
        ),
      ...notices
        .filter(
          (item) =>
            matches(item.SecuritiesCompanyCode, code) &&
            overlaps(item.Date, undefined, month)
        )
        .map(
          (item): Row => [
            displayDate(item.Date),
            '注意',
            item.SecuritiesCompanyCode,
            `${item.CompanyName} ${item.TradingInformation || '-'}`,
          ]
        ),
      ...halts
        .filter(
          (item) =>
            matches(item.SecuritiesCompanyCode, code) &&
            overlaps(
              item.DateOfSuspendedTrading || item.DateOfResumedTrading,
              item.DateOfResumedTrading,
              month
            )
        )
        .map(
          (item): Row => [
            `${displayDate(item.DateOfSuspendedTrading)}～${displayDate(
              item.DateOfResumedTrading
            )}`,
            '暫停',
            item.SecuritiesCompanyCode,
            item.CompanyName,
          ]
        ),
    ]
  }
}

export default Events
