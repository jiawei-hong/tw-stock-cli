import Stock from './Stock'
import axios from 'axios'
import { Table } from 'console-table-printer'
import Field from '../field'
import StockURL from '../url'
import { filterDrawChartDataWithTwoTime, draw } from '../lib/Chart'
import { execute } from '../lib/Prompt'
import { IndexOptionProps } from '..'
import { displayFailed } from '../lib/Text'
import { INDEX_USE_DATE_OPTIONS } from '../message/StockIndex'

type TIndices = {
  TAIEX: string
  TWO: string
  FRMSA: string
}

interface Indices {
  code: string | undefined
  indices: TIndices
  options: IndexOptionProps
  ohlc: string[]
  table: Table
}

class Indices extends Stock {
  constructor(code: string | undefined, options: IndexOptionProps) {
    super(code, options)
    this.code = code
    this.options = options
    this.indices = {
      TAIEX: 'tse_t00.tw',
      TWO: 'otc_o00.tw',
      FRMSA: 'tse_FRMSA.tw',
    }
    this.ohlc = ['TSE', 'OTC', 'FRMSA']
    this.table = new Table({ columns: Field.stockIndex() })
  }

  async initialize() {
    this.options.type = 'index'

    if (this.options.chart) {
      const result = await execute(this.ohlc)

      let data = await axios
        .get(StockURL.getOhlc(result ?? 'TSE'))
        .then((res) => res.data.ohlcArray)

      if (this.options.date) {
        if (this.options.date.length == 2) {
          data = filterDrawChartDataWithTwoTime(data, this.options.date)
        } else {
          displayFailed(INDEX_USE_DATE_OPTIONS)
        }
      }

      if (typeof data === 'string') {
        displayFailed(data)
      } else {
        draw(data)
      }

      return
    }

    if (this.code) {
      let stockIdx = this.code
        .split('-')
        .filter((code) => code.toUpperCase() in this.indices)
        .map((code) => this.getIndices(code))

      if (stockIdx.length > 0) {
        this.url = `${this.prefix}${stockIdx.join('|')}`
      }
    }
  }

  getIndices(code: string) {
    const upperCaseCode = code.toUpperCase()

    switch (upperCaseCode) {
      case 'TAIEX':
        return this.indices.TAIEX
      case 'TWO':
        return this.indices.TWO
      default:
        return this.indices.FRMSA
    }
  }
}

export default Indices
