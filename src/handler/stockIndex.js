const { default: axios } = require('axios')
const { Table } = require('console-table-printer')
const Text = require('../lib/text')

class StockIndex {
  constructor(params) {
    this.url = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch='
    this.options = params.options
    this.index = params.index.toUpperCase()
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
    this.notExecIsNanHandle = ['c', 'ex', 'n', 't']
    this.p = new Table({ columns: this.field })
  }

  execute() {
    const twIndexKeys = Object.keys(this.twIndex)

    if (this.options) {
      let stockIdx = []

      this.index.split('-').forEach((index) => {
        if (!twIndexKeys.includes(index)) {
          console.log(Text.red(`Not Found ${index} Index.`))

          return
        }

        stockIdx.push(this.twIndex[index])
      })

      this.url += stockIdx.join('|')
    } else {
      this.url += this.twIndex[this.index]
    }

    axios.get(this.url).then((res) => {
      const data = res.data

      if (data.msgArray.length == 0) {
        console.log(Text.red('Not found stock index'))
      } else {
        data.msgArray.forEach((stock) => {
          let stockField = {}

          this.field.forEach((field) => {
            stockField[field.name] = stock[field.code]
          })

          this.p.addRow(stockField)
        })
      }

      this.p.printTable()
    })
  }
}

module.exports = StockIndex
