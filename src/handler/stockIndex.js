const { Table } = require('console-table-printer')
const axios = require('axios').default
const Stock = require('./stock')
const Field = require('../field')
const StockURL = require('../url')
const Chart = require('../lib/chart')
const Prompt = require('../lib/prompt')
const { StockIndexMessage } = require('../message')

class StockIndex extends Stock {
  constructor(params) {
    super(params)
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
    if (this.options.draw) {
      const result = await Prompt.select(
        'Ohlc',
        'Pick you want draw index',
        this.ohlc
      )

      const data = await axios
        .get(StockURL.getOhlc(result))
        .then((res) => res.data.ohlcArray)

      Chart.draw(data)

      return
    }

    const twIndexKeys = Object.keys(this.twIndex)

    if (this.options.multiple) {
      let stockIdx = []

      this.code.split('-').forEach((index) => {
        index = index.toUpperCase()

        if (!twIndexKeys.includes(index)) {
          console.log(StockIndexMessage.notFoundIndex(index))

          return
        }

        stockIdx.push(this.twIndex[index])
      })

      if (stockIdx.length == 0) {
        return
      }
      this.url = `${this.prefix}${stockIdx.join('|')}`
    } else {
      const code = this.code.toUpperCase()

      if (!twIndexKeys.includes(code)) {
        console.log(StockIndexMessage.notFoundIndex(index))

        return
      }

      this.url = `${this.prefix}${this.twIndex[code]}`
    }
  }
}

module.exports = StockIndex
