const { Table } = require('console-table-printer')
const Text = require('../lib/text')
const Stock = require('../handler/stock')

class StockIndex extends Stock {
  constructor(params) {
    super(params)
    this.twIndex = {
      TAIEX: 'tse_t00.tw',
      TWO: 'otc_o00.tw',
      FRMSA: 'tse_FRMSA.tw',
    }
    this.field = [
      { code: 'n', name: '指數名稱', alignment: 'center' },
      { code: 'z', name: '當盤指數', color: 'yellow' },
      { code: 'tv', name: '當盤成交量' },
      { code: 'v', name: '累積成交量' },
      { code: 'y', name: '昨收指數', color: 'cyan' },
      { code: 'o', name: '開盤' },
      { code: 'h', name: '最高', color: 'red' },
      { code: 'l', name: '最低', color: 'green' },
      { code: 't', name: '最近成交時刻', alignment: 'center' },
    ]
    this.p = new Table({ columns: this.field })
  }

  initialize() {
    const twIndexKeys = Object.keys(this.twIndex)

    if (this.options.multiple) {
      let stockIdx = []

      this.code.split('-').forEach((index) => {
        index = index.toUpperCase()

        if (!twIndexKeys.includes(index)) {
          console.log(Text.red(`Not Found ${index} Index.`))

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
        console.log(Text.red(`Not Found ${index} Index.`))

        return
      }

      this.url = `${this.prefix}${this.twIndex[code]}`
    }
  }
}

module.exports = StockIndex
