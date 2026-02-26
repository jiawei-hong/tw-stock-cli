import { getStock as fetchStockData } from '@/commands/stock/api'
import Field from '@/commands/stock/field'
import { renderStockTable } from '@/commands/stock/render'
import { extractStockData } from '@/commands/stock/response'
import { getStock as getStockPrefix } from '@/commands/stock/url'
import { generateGetStockURL, toUppercase } from '@/commands/stock/utils'
import { STOCK_NOT_FOUND } from '@/messages/stock'
import { INDEX_USE_DATE_OPTIONS } from '@/messages/stock-index'
import { IndexOptionProps } from '@/types/indices'
import { TStock } from '@/types/stock'
import { draw, filterDrawChartDataWithTwoTime } from '@/utils/chart'
import { getSelectedIndex } from '@/utils/prompt'
import { displayFailed } from '@/utils/text'

import { getOHLC } from './api'

type TIndices = {
  TAIEX: string
  TWO: string
  FRMSA: string
}

const INDICES_MAP: TIndices = {
  TAIEX: 'tse_t00.tw',
  TWO: 'otc_o00.tw',
  FRMSA: 'tse_FRMSA.tw',
}

class Indices {
  private code: string
  private options: IndexOptionProps

  constructor(code: string, options: IndexOptionProps) {
    this.code = code
    this.options = options
  }

  async initialize() {
    if (this.options.chart) {
      return this.executeChart()
    }

    if (this.code) {
      return this.executeRealtime()
    }
  }

  private async executeChart() {
    const type = await getSelectedIndex()

    if (!type) return

    let data = await getOHLC(type)

    if (this.options.time) {
      if (this.options.time.length === 2) {
        data = filterDrawChartDataWithTwoTime(data, this.options.time)

        if (typeof data === 'string') {
          return displayFailed(data)
        }
      } else {
        return displayFailed(INDEX_USE_DATE_OPTIONS)
      }
    }
    draw(data)
  }

  private async executeRealtime() {
    const prefix = getStockPrefix(false)
    const codes = this.code.split('-').map((code) => toUppercase(code))

    const indexKeys = Object.keys(INDICES_MAP)
    const indexTickers = codes
      .filter((code) => indexKeys.includes(code))
      .map((code) => INDICES_MAP[code as keyof TIndices])

    const stockCodes = codes.filter((code) => !indexKeys.includes(code))
    const stockTickers = generateGetStockURL({ stocks: stockCodes })

    const allTickers = [indexTickers.join('|'), stockTickers]
      .filter(Boolean)
      .join('|')

    if (!allTickers) return

    const url = `${prefix}${allTickers}`
    const response = await fetchStockData(url)
    const stocks = extractStockData(response)

    if (typeof stocks === 'string') {
      return displayFailed(stocks)
    }

    if (!stocks || stocks.length === 0) {
      return displayFailed(STOCK_NOT_FOUND)
    }

    const fields = Field.basic({})
    renderStockTable(stocks as TStock[], fields)
  }
}

export default Indices
