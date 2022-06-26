import Stock from './stock'
import axios from 'axios'
import { Table } from 'console-table-printer'
import Field from '../field'
import StockURL from '../url'
import Chart from '../lib/chart'
import Prompt from '../lib/prompt'
const { StockIndexMessage } = require('../message')

class StockIndex extends Stock {
  constructor(params) {
    super(params)
    this.data = []
    this.options.type = 'index'
    this.twIndex = {
      TAIEX: 'tse_t00.tw',
      TWO: 'otc_o00.tw',
      FRMSA: 'tse_FRMSA.tw',
    }
    this.ohlc = ['TSE', 'OTC', 'FRMSA']
    this.p = new Table({ columns: Field.stockIndex() })
  }

  async initialize() {
    if (this.options.chart) {
      const result = await Prompt.select(
        'Ohlc',
        'Pick you want draw index',
        this.ohlc
      )

      let data = await axios
        .get(StockURL.getOhlc(result))
        .then((res) => res.data.ohlcArray)

      if (this.options.date) {
        if (this.options.date.length == 2) {
          data = Chart.filterDrawChartDataWithTwoTime(data, this.options.date)
        } else {
          console.log(StockIndexMessage.useDateOptionsButNotGiveTwoTime())
        }
      }

      if (typeof data === 'string') {
        console.log(data)
      } else {
        Chart.draw(data)
      }

      return
    }

    if (this.options.multiple) {
      let stockIdx = this.code
        .split('-')
        .filter((code) => this.indexExistInTwIndexkeys(code.toUpperCase()))
        .map((code) => this.twIndex[code.toUpperCase()])

      if (stockIdx.length > 0) {
        this.url = `${this.prefix}${stockIdx.join('|')}`
      }
    } else {
      const code = this.code.toUpperCase()

      if (!this.indexExistInTwIndexkeys(code)) {
        console.log(StockIndexMessage.notFoundIndex(code))
      } else {
        this.url = `${this.prefix}${this.twIndex[code]}`
      }
    }
  }

  indexExistInTwIndexkeys(index) {
    const twIndexKeys = Object.keys(this.twIndex)

    return twIndexKeys.includes(index)
  }
}

export default StockIndex
