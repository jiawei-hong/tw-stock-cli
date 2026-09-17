import { getRankUrl } from '@/commands/rank/url'
import { Category } from '@/types/stock'
import { requestJson } from '@/utils/http'
import { marketDate, strictNumber, validDate } from '@/utils/market-date'
import { responsiveTable } from '@/utils/table'
import { displayFailed, displayWarning } from '@/utils/text'

export type ScreenOptions = {
  listed?: Category
  date?: string
  minPrice?: number
  maxPrice?: number
  minVolume?: number
  maxVolume?: number
  minChange?: number
  maxChange?: number
  sort?: 'volume' | 'change' | 'price'
  number?: number
}
export type ScreenRow = {
  code: string
  name: string
  close: number
  volume: number
  changePercent?: number
}

export function validateScreen(options: ScreenOptions): void {
  if (
    options.listed !== undefined &&
    ![Category.TSE, Category.OTC].includes(options.listed)
  )
    throw new Error('market must be tse or otc')
  if (options.date !== undefined && !validDate(options.date))
    throw new Error('--date must be a valid YYYY-MM-DD date')
  for (const [min, max, label] of [
    [options.minPrice, options.maxPrice, 'price'],
    [options.minVolume, options.maxVolume, 'volume'],
    [options.minChange, options.maxChange, 'change'],
  ] as const) {
    for (const value of [min, max]) {
      if (
        value !== undefined &&
        (!Number.isFinite(value) || (label !== 'change' && value < 0))
      )
        throw new Error(
          `${label} bounds must be finite${
            label === 'change' ? '' : ' and non-negative'
          }`
        )
      if (
        label === 'volume' &&
        value !== undefined &&
        !Number.isSafeInteger(value)
      )
        throw new Error('volume bounds must be whole shares')
    }
    if (min !== undefined && max !== undefined && min > max)
      throw new Error(`minimum ${label} must not exceed maximum ${label}`)
  }
  if (
    options.number !== undefined &&
    (!Number.isSafeInteger(options.number) || options.number < 1)
  )
    throw new Error('--number must be a positive integer')
  if (
    options.sort !== undefined &&
    !['volume', 'change', 'price'].includes(options.sort)
  )
    throw new Error('--sort must be volume, change, or price')
}

export function parseScreen(
  data: unknown,
  market: Category
): { date: string; rows: ScreenRow[]; skipped: number } {
  if (!data || typeof data !== 'object')
    throw new Error('Invalid daily market response')
  const response = data as {
    stat?: unknown
    date?: unknown
    tables?: { title?: string; data?: unknown }[]
  }
  if (typeof response.stat !== 'string' || response.stat.toLowerCase() !== 'ok')
    throw new Error(`Daily market data unavailable: ${String(response.stat)}`)
  const date = marketDate(response.date)
  if (!date) throw new Error('Daily market response has no valid source date')
  if (!Array.isArray(response.tables))
    throw new Error('Invalid daily market tables')
  const table =
    market === Category.TSE
      ? response.tables.find((item) => item.title?.includes('每日收盤行情'))
      : response.tables[0]
  if (!Array.isArray(table?.data))
    throw new Error('Daily closing prices unavailable')
  const rows: ScreenRow[] = []
  let skipped = 0
  for (const raw of table.data) {
    if (!Array.isArray(raw)) throw new Error('Invalid daily market row')
    const code = typeof raw[0] === 'string' ? raw[0].trim() : ''
    const name = typeof raw[1] === 'string' ? raw[1].trim() : ''
    const close = strictNumber(raw[market === Category.TSE ? 8 : 2])
    const volume = strictNumber(raw[market === Category.TSE ? 2 : 8])
    if (
      !code ||
      !name ||
      close === undefined ||
      close <= 0 ||
      volume === undefined ||
      volume < 0 ||
      !Number.isSafeInteger(volume)
    ) {
      skipped++
      continue
    }
    let change = strictNumber(raw[market === Category.TSE ? 10 : 3])
    if (market === Category.TSE && change !== undefined) {
      const direction =
        typeof raw[9] === 'string' ? raw[9].replace(/<[^>]*>/g, '').trim() : ''
      if (direction === '-') change = -Math.abs(change)
      else if (direction === '+') change = Math.abs(change)
      else if (change !== 0 || (direction !== '' && direction !== 'X'))
        change = undefined
      if (direction === 'X') change = undefined
    }
    const previous = change === undefined ? undefined : close - change
    const percent =
      previous !== undefined && previous > 0
        ? (change! / previous) * 100
        : undefined
    rows.push({
      code,
      name,
      close,
      volume,
      changePercent:
        percent !== undefined && Number.isFinite(percent) ? percent : undefined,
    })
  }
  return { date, rows, skipped }
}

export function filterScreen(
  rows: ScreenRow[],
  options: ScreenOptions
): ScreenRow[] {
  const within = (value: number | undefined, min?: number, max?: number) =>
    (min === undefined && max === undefined) ||
    (value !== undefined &&
      (min === undefined || value >= min) &&
      (max === undefined || value <= max))
  const filtered = rows.filter(
    (row) =>
      within(row.close, options.minPrice, options.maxPrice) &&
      within(row.volume, options.minVolume, options.maxVolume) &&
      within(row.changePercent, options.minChange, options.maxChange)
  )
  const value = (row: ScreenRow) =>
    options.sort === 'price'
      ? row.close
      : options.sort === 'change'
      ? row.changePercent ?? -Infinity
      : row.volume
  return filtered.sort(
    (left, right) =>
      value(right) - value(left) || left.code.localeCompare(right.code)
  )
}

class Screen {
  constructor(private options: ScreenOptions) {}

  initialize(): Promise<void> {
    return this.execute().catch((error) => displayFailed(String(error)))
  }

  async execute(): Promise<void> {
    validateScreen(this.options)
    const market = this.options.listed ?? Category.TSE
    const url =
      market === Category.OTC
        ? `https://www.tpex.org.tw/www/zh-tw/afterTrading/dailyQuotes?${new URLSearchParams(
            {
              date: this.options.date?.replaceAll('-', '/') ?? '',
              response: 'json',
            }
          )}`
        : getRankUrl(this.options.date?.replaceAll('-', '') ?? '', market)
    const response = parseScreen(await requestJson<unknown>(url), market)
    if (this.options.date && response.date !== this.options.date)
      throw new Error(
        `Requested ${this.options.date}, but source returned ${response.date}`
      )
    if (!response.rows.length)
      throw new Error('No valid daily closing prices available')
    if (response.skipped)
      displayWarning(
        `Skipped ${response.skipped} rows with unavailable or invalid price/volume`
      )
    const matched = filterScreen(response.rows, this.options)
    const shown = matched.slice(0, this.options.number ?? 20)
    console.log(`${market.toUpperCase()} 盤後篩選 ${response.date}`)
    console.log(`符合 ${matched.length} 筆，顯示 ${shown.length} 筆`)
    if (!matched.length) {
      console.log('沒有符合條件的股票')
      return
    }
    console.log(
      responsiveTable(
        [
          ['代號', '名稱', '收盤價', '漲跌幅 (%)', '成交股數'],
          ...shown.map((row) => [
            row.code,
            row.name,
            row.close.toFixed(2),
            row.changePercent?.toFixed(2) ?? '-',
            row.volume.toLocaleString('en-US'),
          ]),
        ],
        1
      )
    )
  }
}

export default Screen
