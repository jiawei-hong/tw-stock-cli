import Stock from '@/commands/stock/handler'
import { toUppercase } from '@/commands/stock/utils'
import { INDEX_USE_DATE_OPTIONS } from '@/messages/stock-index'
import { IndexOptionProps } from '@/types/indices'
import { draw, filterDrawChartDataWithTwoTime } from '@/utils/chart'
import { getSelectedIndex } from '@/utils/prompt'
import { displayFailed } from '@/utils/text'

import { getOHLC } from './api'

type TIndices = {
  TAIEX: string
  TWO: string
  FRMSA: string
}

interface Indices {
  code: string
  indices: TIndices
  options: IndexOptionProps
  ohlc: string[]
}

class Indices extends Stock {
  constructor(code: string, options: IndexOptionProps) {
    super(code, options)
    this.options.type = 'index'
    this.options = options
    this.indices = {
      TAIEX: 'tse_t00.tw',
      TWO: 'otc_o00.tw',
      FRMSA: 'tse_FRMSA.tw',
    }
  }

  async initialize() {
    if (this.options.chart) {
      const type = await getSelectedIndex()

      if (type) {
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
      return
    }

    if (this.code) {
      let stockIdx = this.code
        .split('-')
        .map((code) => toUppercase(code))
        .filter((code) => Object.keys(this.indices).includes(toUppercase(code)))
        .map((code) => this.indices[code as keyof typeof this.indices])

      if (!!stockIdx) {
        this.url = `${this.prefix}${stockIdx.join('|')}`
      }
      this.execute()
    }
  }
}

export default Indices
