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
        { name: '代號', alignment: 'center' },
        { name: '公司', alignment: 'center' },
        { name: '當盤成交價', color: 'yellow' },
        { name: '當盤成交量' },
        { name: '累積成交量' },
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
          const upsAndDownsPercentage = (
            ((parseFloat(stock.z) - parseFloat(stock.y)) /
              parseFloat(stock.y)) *
            100
          ).toFixed(2)
          let stockData = {
            代號: stock.c,
            公司: stock.n,
            昨收: isNaN(stock.y) ? stock.y : strConvertToDecimalPoint(stock.y),
            開盤: isNaN(stock.o) ? stock.o : strConvertToDecimalPoint(stock.o),
            最高: isNaN(stock.h) ? stock.h : strConvertToDecimalPoint(stock.h),
            最低: isNaN(stock.l) ? stock.l : strConvertToDecimalPoint(stock.l),
            漲停: strConvertToDecimalPoint(stock.u),
            跌停: strConvertToDecimalPoint(stock.w),
            當盤成交價: isNaN(stock.z)
              ? stock.z
              : strConvertToDecimalPoint(stock.z),
            當盤成交量: isNaN(stock.tv)
              ? stock.tv
              : strConvertToDecimalPoint(stock.tv),
            累積成交量: isNaN(stock.v)
              ? stock.v
              : strConvertToDecimalPoint(stock.v),
            最近成交時刻: stock.t,
            漲跌幅: `\x1b[${
              upsAndDownsPercentage > 0 ? '31' : '32'
            }m${upsAndDownsPercentage}%\x1b[0m`,
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