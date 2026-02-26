import { getStock as fetchStockData } from '@/commands/stock/api'
import { renderStockTable } from '@/commands/stock/render'
import { extractStockData } from '@/commands/stock/response'
import Field from '@/commands/stock/field'
import { getStock as getStockPrefix } from '@/commands/stock/url'
import { toUppercase } from '@/commands/stock/utils'
import { INDEX_USE_DATE_OPTIONS } from '@/messages/stock-index'
import { STOCK_NOT_FOUND } from '@/messages/stock'
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
      if (this.options.time.length == 2) {
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
    const stockIdx = this.code
      .split('-')
      .map((code) => toUppercase(code))
      .filter((code) => Object.keys(INDICES_MAP).includes(toUppercase(code)))
      .map((code) => INDICES_MAP[code as keyof TIndices])

    if (!stockIdx.length) return

    const url = `${prefix}${stockIdx.join('|')}`
    const response = await fetchStockData(url)
    const stocks = extractStockData(response)

    if (typeof stocks === 'string') {
      return displayFailed(STOCK_NOT_FOUND)
    }

    if (!stocks || stocks.length === 0) {
      return displayFailed(STOCK_NOT_FOUND)
    }

    const fields = Field.stockIndex()
    renderStockTable(stocks as TStock[], fields)
  }
}

export default Indices
