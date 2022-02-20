const { default: axios } = require('axios')
const fs = require('fs')
const path = require('path')
const { Table } = require('console-table-printer')
const { strConvertToDecimalPoint } = require('../lib/text')

class Stock {
  constructor(params) {
    this.prefix = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch='
    this.url = ''
    this.stocks = []
    this.code = params.code
    this.options = params.options
    this.stockCategoryPath = path.resolve(`${__dirname}/../stock.json`)
    this.p = new Table({
      columns: [
        { name: '代號', alignment: 'center' },
        { name: '類別', alignment: 'center' },
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

  initialize() {
    if (this.options.multiple) {
      if (this.checkStockFileExist()) {
        this.stocks = JSON.parse(
          fs.readFileSync(this.stockCategoryPath, 'utf-8')
        )

        let stock = []

        for (let stockCode of this.code.split('-')) {
          stockCode = stockCode.toUpperCase()
          let existTse = this.checkStockExistInCateogry(stockCode)
          let existOtc = this.checkStockExistInCateogry(stockCode, 'otc')

          if (existTse || existOtc) {
            stock.push(`${existTse ? 'tse' : 'otc'}_${stockCode}.tw`)
          } else {
            console.log(`\x1b[1;31mNot found ${stockCode} stock.\x1b[0m`)
          }
        }

        if (stock.length > 0) {
          this.url = `${this.prefix}${stock.join('|')}`
        }
      } else {
        console.log('\x1b[1;31mNot found stock.json file.\x1b[0m')
      }
    } else {
      this.url = `${this.prefix}${
        this.options.listed
      }_${this.code.toUpperCase()}.tw`
    }

    if (this.url.length > 0) {
      axios.get(this.url).then((res) => {
        const data = res.data
        if (data.msgArray.length === 0) {
          console.log('\x1b[1;31mNot found stock.\x1b[0m')
        } else {
          data.msgArray.forEach((stock) => {
            const upsAndDownsPercentage = (
              ((parseFloat(stock.z) - parseFloat(stock.y)) /
                parseFloat(stock.y)) *
              100
            ).toFixed(2)
            let stockData = {
              代號: stock.c,
              類別: stock.ex == 'tse' ? '上市' : '上櫃',
              公司: stock.n,
              昨收: isNaN(stock.y)
                ? stock.y
                : strConvertToDecimalPoint(stock.y),
              開盤: isNaN(stock.o)
                ? stock.o
                : strConvertToDecimalPoint(stock.o),
              最高: isNaN(stock.h)
                ? stock.h
                : strConvertToDecimalPoint(stock.h),
              最低: isNaN(stock.l)
                ? stock.l
                : strConvertToDecimalPoint(stock.l),
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
              漲跌幅: isNaN(upsAndDownsPercentage)
                ? upsAndDownsPercentage
                : `\x1b[${
                    upsAndDownsPercentage == 0
                      ? '0'
                      : upsAndDownsPercentage > 0
                      ? '31'
                      : '32'
                  }m${`${upsAndDownsPercentage}%`}\x1b[0m`,
            }

            if (stock.ex == 'otc') {
              delete stockData.漲停
              delete stockData.跌停
            }

            this.p.addRow(stockData)
          })

          this.p.printTable()
        }
      })
    }
  }

  checkStockExistInCateogry(stockCode, category = 'tse') {
    const stock = this.stocks[stockCode]

    return stock && stock.category == category
  }

  checkStockFileExist() {
    return fs.existsSync(this.stockCategoryPath)
  }
}

module.exports = Stock
