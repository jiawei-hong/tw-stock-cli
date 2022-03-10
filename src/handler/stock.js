const { default: axios } = require('axios')
const fs = require('fs')
const path = require('path')
const { Table } = require('console-table-printer')
const Text = require('../lib/text')
const Favorite = require('./favroite')

class Stock {
  constructor(params) {
    this.prefix = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch='
    this.url = ''
    this.stocks = []
    this.favorite = new Favorite()
    this.code = params.code
    this.options = params.options
    this.stockCategoryPath = path.resolve(`${__dirname}/../stock.json`)
    this.field = [
      { code: 'c', name: '代號', alignment: 'center' },
      {
        code: 'ex',
        name: '類別',
        alignment: 'center',
        callback: (stock) => (stock.ex === 'tse' ? '上市' : '上櫃'),
      },
      { code: 'n', name: '公司', alignment: 'center' },
      { code: 'z', name: '當盤成交價', color: 'yellow' },
      { code: 'tv', name: '當盤成交量' },
      { code: 'v', name: '累積成交量' },
      { code: 'y', name: '昨收', color: 'cyan' },
      { code: 'o', name: '開盤' },
      { code: 'h', name: '最高' },
      { code: 'l', name: '最低' },
      { code: 'u', name: '漲停', color: 'red' },
      { code: 'w', name: '跌停', color: 'green' },
      { code: 't', name: '最近成交時刻', alignment: 'center' },
      {
        name: '漲跌幅',
        callback: this.getStockUpsAndDownsPercentage,
      },
    ]
    this.notExecIsNanHandle = ['c', 'ex', 'n', 't']
    this.p = new Table({ columns: this.field })
  }

  initialize() {
    if (this.options.multiple && !this.checkStockFileExist()) {
      console.log(
        Text.red(
          'If you want search multiple stock, please run update command.'
        )
      )
    } else {
      if (this.options.favorite && !this.favorite.checkExistFavoriteFile()) {
        console.log(
          Text.red(
            'If you watnt useFavorite show stock,plz create favorite list.'
          )
        )

        return
      }

      this.url = this.getStockUrl()

      if (this.url) {
        axios.get(this.url).then((res) => {
          const data = res.data

          if (data.msgArray.length === 0) {
            console.log(Text.red('Not Found Stock.'))
          } else {
            data.msgArray.forEach((stock) => {
              let stockField = {}

              this.field.forEach((field) => {
                stockField[field.name] = this.notExecIsNanHandle.includes(
                  field.code
                )
                  ? stock[field.code]
                  : Text.strIsNanHandle(stock[field.code])

                if (field.callback) {
                  stockField[field.name] = field.callback(stock)
                }
              })

              if (stock.ex == 'otc') {
                delete stockField.漲停
                delete stockField.跌停
              }

              this.p.addRow(stockField)
            })

            this.p.printTable()
          }
        })
      }
    }
  }

  getStockUrl() {
    if (!this.code && !this.options.favorite) {
      console.log(Text.red('Please enter stock code.'))

      return
    }

    if (this.options.multiple) {
      this.stocks = this.getAllStockCategory()

      let stock = []

      for (let stockCode of this.code.split('-')) {
        if (!stockCode) {
          return
        }

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
        return `${this.prefix}${stock.join('|')}`
      }
    } else if (this.options.favorite) {
      if (this.favorite.checkFavoriteNotExistStock()) {
        console.log(Text.red('Your favorite list not have any stock.'))

        return
      }

      const favoriteUrl = this.favorite.getFavoriteStocksUrl()

      return `${this.prefix}${favoriteUrl}`
    }

    return `${this.prefix}${this.options.listed}_${this.code.toUpperCase()}.tw`
  }

  getStockUpsAndDownsPercentage(stock) {
    let [yesterdayPrice, currentPrice] = [stock.y, stock.z]

    const percenetage = Text.strIsNanHandle(
      ((parseFloat(currentPrice) - parseFloat(yesterdayPrice)) /
        yesterdayPrice) *
        100
    )

    return isNaN(percenetage) ? '-' : Text.percentageHandle(percenetage)
  }

  getAllStockCategory() {
    return JSON.parse(fs.readFileSync(this.stockCategoryPath), 'utf8')
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
