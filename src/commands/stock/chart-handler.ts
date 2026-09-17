import { plot } from 'asciichart'

import {
  HistoryPoint,
  historyWindow,
  loadHistory,
} from '@/services/stock-history'
import { Category, StockOptionProps } from '@/types/stock'
import { responsiveTable } from '@/utils/table'
import { displayFailed } from '@/utils/text'

export function sampleCloses(points: HistoryPoint[], count: number): number[] {
  if (points.length <= count) return points.map((point) => point.close)
  return Array.from(
    { length: count },
    (_, index) =>
      points[Math.round((index * (points.length - 1)) / (count - 1))].close
  )
}

export function renderHistoryChart(
  points: HistoryPoint[],
  code: string,
  market: Category
): void {
  const first = points[0]
  const last = points.at(-1)!
  const prices = points.map((point) => point.close)
  const summary = [
    ['項目', '數值'],
    ['個股', `${code} ${market.toUpperCase()}`],
    ['開始', first.date],
    ['結束', last.date],
    ['收盤價', last.close.toFixed(2)],
    ['區間漲跌幅', `${((last.close / first.close - 1) * 100).toFixed(2)}%`],
    ['最低收盤', Math.min(...prices).toFixed(2)],
    ['最高收盤', Math.max(...prices).toFixed(2)],
    ['交易日數', String(points.length)],
    ['價格類型', '原始收盤價（未還原權息）'],
    ['橫軸', '交易日順序，左舊右新'],
  ]
  const labelWidth =
    Math.max(...prices.map((price) => price.toFixed(2).length)) + 1
  const columns = process.stdout.columns || 80
  const count = Math.min(120, columns - labelWidth - 2)
  if (count < 2) {
    summary.push(['圖形', '終端太窄，僅顯示摘要'])
  } else {
    const sampled = sampleCloses(points, count)
    const flat = sampled.every((price) => price === sampled[0])
    if (sampled.length < points.length)
      summary.push(['圖形', '依寬度等距抽樣；摘要使用全部資料'])
    console.log(
      plot(sampled, {
        height: 10,
        offset: 2,
        format: (value) =>
          (flat ? sampled[0] : value).toFixed(2).padStart(labelWidth),
      })
    )
  }
  console.log(responsiveTable(summary, 1))
}

class StockChart {
  constructor(
    private code: string | undefined,
    private options: StockOptionProps
  ) {}

  initialize(): Promise<void> {
    return this.execute().catch((error) => displayFailed(String(error)))
  }

  async execute(): Promise<void> {
    const code = this.code?.trim().toUpperCase() ?? ''
    if (!/^[A-Z0-9]{4,6}$/.test(code))
      throw new Error('stock code must contain 4 to 6 letters or digits')
    const market = this.options.listed ?? Category.TSE
    if (market !== Category.TSE && market !== Category.OTC)
      throw new Error('market must be tse or otc')
    const window = historyWindow(this.options.range, this.options.date)
    const points = await loadHistory(code, market, window)
    if (!points.length)
      throw new Error(
        `No closing prices found for ${code} from ${window.start} to ${window.end}`
      )
    renderHistoryChart(points, code, market)
  }
}

export default StockChart
