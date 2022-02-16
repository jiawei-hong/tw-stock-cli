const { default: axios } = require('axios')
const { Table } = require('console-table-printer')
const { strConvertToDecimalPoint } = require('../lib/text')

class Stock {
  constructor(params) {
    this.url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${
      params.options.listed
    }_${params.code.toUpperCase()}.tw`

    this.code = params.code
    this.options = params.options
    this.data = {}
    this.p = new Table({
      columns: [
        { name: '公司', alignment: 'center' },
        { name: '當前成交', color: 'yellow' },
        { name: '當盤成交量' },
        { name: '昨收', color: 'cyan' },
        { name: '開盤' },
        { name: '最高' },
        { name: '最低' },
        { name: '漲停', color: 'red' },
        { name: '跌停', color: 'green' },
        { name: '最近成交時刻', alignment: 'center' },
      ],
    })
  }

  async getStockCurrentPrice() {
    if (this.options.listed !== 'tse' && this.options.listed !== 'otc') {
      console.log(`\x1b[1;31mNot found ${this.options.listed} category.\x1b[0m`)
    } else {
      const res = await axios.get(this.url).then((res) => res.data)

      if (res.msgArray.length === 0) {
        console.log('\x1b[1;31mNot found stock.\x1b[0m')
      } else {
        res.msgArray.forEach((stock) => {
          let stockData = {
            公司: stock.n,
            昨收: isNaN(stock.y) ? stock.y : strConvertToDecimalPoint(stock.y),
            開盤: isNaN(stock.o) ? stock.o : strConvertToDecimalPoint(stock.o),
            最高: isNaN(stock.h) ? stock.h : strConvertToDecimalPoint(stock.h),
            最低: isNaN(stock.l) ? stock.l : strConvertToDecimalPoint(stock.l),
            漲停: strConvertToDecimalPoint(stock.u),
            跌停: strConvertToDecimalPoint(stock.w),
            當前成交: isNaN(stock.z)
              ? stock.z
              : strConvertToDecimalPoint(stock.z),
            當前成交量: isNaN(stock.tv)
              ? stock.tv
              : strConvertToDecimalPoint(stock.tv),
            最近成交時刻: stock.t,
          }

          if (stock.ex == 'otc') {
            delete stockData.漲停
            delete stockData.跌停
          }

          this.p.addRow(stockData)
        })

        this.p.printTable()
      }
    }
  }
}

module.exports = Stock
