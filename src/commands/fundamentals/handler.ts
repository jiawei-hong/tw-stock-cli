import {
  formatRocDate,
  formatRocMonth,
  getTwseOpenData,
} from '@/services/twse-openapi'
import { Category } from '@/types/stock'
import { requestJson } from '@/utils/http'
import { responsiveTable } from '@/utils/table'
import { displayFailed, displayWarning } from '@/utils/text'

type Row = Record<string, unknown>
type Valuation = Row
type Revenue = Row
type Income = Row

const INDUSTRIES = ['ci', 'basi', 'bd', 'fh', 'ins', 'mim'] as const
const TPEX_API_URL = 'https://www.tpex.org.tw/openapi/v1'

function isRow(value: unknown): value is Row {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRows(value: unknown): value is Row[] {
  return Array.isArray(value) && value.every(isRow)
}

async function getTpexOpenData<T>(path: string): Promise<T[]> {
  const data = await requestJson<unknown>(`${TPEX_API_URL}/${path}`)
  if (!isRows(data)) throw new Error('Invalid TPEx OpenAPI response')
  return data as T[]
}

function field(row: Row | undefined, ...keys: string[]): string {
  for (const key of keys) {
    const item = row?.[key]
    if (typeof item === 'string' && item.trim()) return item
    if (typeof item === 'number' && Number.isFinite(item)) return String(item)
  }
  return '-'
}

function codeOf(row: Row): string {
  return field(row, 'Code', '公司代號', 'SecuritiesCompanyCode')
}

function nameOf(row: Row | undefined): string {
  return field(row, 'Name', '公司名稱', 'CompanyName')
}

function numberValue(value: string): number | undefined {
  const parsed = Number(value.replaceAll(',', ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function incomePeriod(
  row: Income
): { year: number; season: number } | undefined {
  const year = numberValue(field(row, '年度', 'Year'))
  const season = numberValue(field(row, '季別', 'Season'))
  if (
    year === undefined ||
    season === undefined ||
    !Number.isInteger(year) ||
    !Number.isInteger(season) ||
    season < 1 ||
    season > 4
  ) {
    return undefined
  }
  return { year, season }
}

function periodText(row: Income | undefined): string {
  const period = row && incomePeriod(row)
  return period ? `${period.year + 1911} Q${period.season}` : '-'
}

function latestIncome(rows: Income[], code: string): Income | undefined {
  return rows
    .filter((row) => codeOf(row) === code && incomePeriod(row))
    .sort((left, right) => {
      const leftPeriod = incomePeriod(left)!
      const rightPeriod = incomePeriod(right)!
      return (
        rightPeriod.year - leftPeriod.year ||
        rightPeriod.season - leftPeriod.season
      )
    })[0]
}

async function load<T>(
  label: string,
  fetcher: () => Promise<T[]>
): Promise<{ rows: T[]; failed: boolean }> {
  try {
    const rows = await fetcher()
    if (!isRows(rows)) throw new Error('response rows are not objects')
    return { rows, failed: false }
  } catch (error) {
    displayWarning(`${label} unavailable: ${String(error)}`)
    return { rows: [], failed: true }
  }
}

class Fundamentals {
  private readonly code: string
  private readonly market: Category

  constructor(code: string, market: Category = Category.TSE) {
    if (market !== Category.TSE && market !== Category.OTC) {
      throw new Error(`Invalid market: ${market}`)
    }
    this.code = code
    this.market = market
  }

  initialize(): Promise<void> {
    return this.execute().catch((error) => displayFailed(String(error)))
  }

  async execute(): Promise<void> {
    const code = this.code.trim().toUpperCase()
    if (!/^[A-Z0-9]{4,6}$/.test(code)) {
      throw new Error('stock code must contain 4 to 6 letters or digits')
    }
    const isTpex = this.market === Category.OTC
    const getData = <T>(path: string) =>
      isTpex ? getTpexOpenData<T>(path) : getTwseOpenData<T>(path)
    const valuationPath = isTpex
      ? 'tpex_mainboard_peratio_analysis'
      : 'exchangeReport/BWIBBU_ALL'
    const revenuePath = isTpex ? 'mopsfin_t187ap05_O' : 'opendata/t187ap05_L'
    const incomePath = (industry: string) =>
      isTpex
        ? `mopsfin_t187ap06_O_${industry}`
        : `opendata/t187ap06_L_${industry}`

    const [valuationResult, revenueResult] = await Promise.all([
      load('valuation', () => getData<Valuation>(valuationPath)),
      load('revenue', () => getData<Revenue>(revenuePath)),
    ])
    const incomeResults: Array<{ rows: Income[]; failed: boolean }> = []
    for (const industry of INDUSTRIES) {
      const result = await load(`income/${industry}`, () =>
        getData<Income>(incomePath(industry))
      )
      incomeResults.push(result)
      if (
        result.rows.some((row) => codeOf(row) === code && incomePeriod(row))
      ) {
        break
      }
    }
    if (
      valuationResult.failed &&
      revenueResult.failed &&
      incomeResults.every((result) => result.failed)
    ) {
      throw new Error(
        `Unable to load ${this.market.toUpperCase()} fundamentals for ${code}`
      )
    }

    const valuation = valuationResult.rows.find((row) => codeOf(row) === code)
    const revenue = revenueResult.rows.find((row) => codeOf(row) === code)
    const incomes = incomeResults.flatMap((result) => result.rows)
    const income = latestIncome(incomes, code)
    if (!valuation && !revenue && !income) {
      throw new Error(
        `No ${this.market.toUpperCase()} fundamentals found for ${code}`
      )
    }

    const candidateName = nameOf(valuation ?? revenue ?? income)
    const name = candidateName === '-' ? code : candidateName
    const valuationDate = formatRocDate(field(valuation, 'Date'))
    const revenueMonth = formatRocMonth(field(revenue, '資料年月'))
    const data = [
      ['項目', '數值', '資料期間'],
      ['公司', `${code} ${name}`, '-'],
      [
        '本益比',
        field(valuation, 'PEratio', 'PriceEarningRatio'),
        valuationDate,
      ],
      [
        '殖利率 (%)',
        field(valuation, 'DividendYield', 'YieldRatio'),
        valuationDate,
      ],
      [
        '股價淨值比',
        field(valuation, 'PBratio', 'PriceBookRatio'),
        valuationDate,
      ],
      ['月營收 (千元)', field(revenue, '營業收入-當月營收'), revenueMonth],
      ['年增率 (%)', field(revenue, '營業收入-去年同月增減(%)'), revenueMonth],
      [
        '累計營收 (千元)',
        field(revenue, '累計營業收入-當月累計營收'),
        revenueMonth,
      ],
      [
        '累計年增率 (%)',
        field(revenue, '累計營業收入-前期比較增減(%)'),
        revenueMonth,
      ],
      [
        '基本 EPS (YTD)',
        field(income, '基本每股盈餘（元）', 'EPS'),
        periodText(income),
      ],
    ]
    console.log(responsiveTable(data, 0))
  }
}

export default Fundamentals
