const { default: axios } = require('axios')
const fs = require('fs')
const path = require('path')
const { Table } = require('console-table-printer')
const Text = require('../lib/text')

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
            console.log(Text.red(`Not found ${stockCode} stock.`))
          }
        }

        if (stock.length > 0) {
          this.url = `${this.prefix}${stock.join('|')}`
        }
      } else {
        console.log(Text.red('Not found stock.json file.'))
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
          console.log(Text.red('Not Found Stock.'))
        } else {
          data.msgArray.forEach((stock) => {
            const upsAndDownsPercentage = Text.strIsNanHandle(
              ((parseFloat(stock.z) - parseFloat(stock.y)) /
                parseFloat(stock.y)) *
                100
            )
            let stockData = {
              代號: stock.c,
              類別: stock.ex == 'tse' ? '上市' : '上櫃',
              公司: stock.n,
              昨收: Text.strIsNanHandle(stock.y),
              開盤: Text.strIsNanHandle(stock.o),
              最高: Text.strIsNanHandle(stock.h),
              最低: Text.strIsNanHandle(stock.l),
              漲停: Text.strConvertToDecimalPoint(stock.u),
              跌停: Text.strConvertToDecimalPoint(stock.w),
              當盤成交價: Text.strIsNanHandle(stock.z),
              當盤成交量: Text.strIsNanHandle(stock.tv),
              累積成交量: Text.strIsNanHandle(stock.v),
              最近成交時刻: stock.t,
              漲跌幅:
                upsAndDownsPercentage.length > 1
                  ? Text.percentageHandle(upsAndDownsPercentage)
                  : upsAndDownsPercentage,
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
