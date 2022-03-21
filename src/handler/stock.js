const axios = require('axios').default
const fs = require('fs')
const path = require('path')
const { Table } = require('console-table-printer')
const Text = require('../lib/text')
const Favorite = require('./favorite')
const StockURL = require('../url/index')
const Field = require('../field')

class Stock {
  constructor(params) {
    this.prefix = StockURL.getStockAPI(params.options.oddlot)
    this.url = ''
    this.stocks = []
    this.favorite = new Favorite()
    this.code = params.code
    this.options = params.options
    this.stockCategoryPath = path.resolve(`${__dirname}/../stock.json`)
    this.notExecIsNanHandle = ['c', 'ex', 'n', 't', 0, 1, 2, 7, 8]
    this.p = new Table({ columns: this.getField() })
    this.date = []
    this.dateExistDay = false
  }

  initialize() {
    if (this.options.multiple && !this.checkStockFileExist()) {
      console.log(
        Text.red(
          'If you want search multiple stock, please run update command.'
        )
      )

      return
    }

    if (this.options.favorite && !this.favorite.checkExistFavoriteFile()) {
      console.log(
        Text.red(
          'If you watnt useFavorite show stock,plz create favorite list.'
        )
      )

      return
    }

    this.url = this.getStockUrl()
  }

  execute() {
    this.initialize()

    if (this.url) {
      axios.get(this.url).then((res) => {
        const data = this.getStockData(res.data)

        if (typeof data === 'string' || data.length === 0) {
          console.log(
            Text.red(
              typeof data === 'string'
                ? data
                : 'Not found stock or input invalid date.'
            )
          )
        } else {
          data.forEach((stock) => {
            let stockField = {}

            if (this.dateExistDay) {
              let d = this.date.slice(0)

              if (this.options.listed == 'tse') {
                d[0] -= 1911
              }

              const searchDay = d.join('/')

              if (searchDay != stock[0]) {
                return
              }
            }

            this.getField().forEach((field) => {
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

          if (this.options.date) {
            console.log(Text.green(`您搜尋的編號是:${this.code}`))
          }

          this.p.printTable()
        }
      })
    }
  }

  getStockData(data) {
    const dataField = ['data', 'aaData', 'msgArray']
    const getDataKey = Object.keys(data).find((key) => dataField.includes(key))

    if (!getDataKey) {
      return '查詢日期大於今日，請重新查詢!'
    }

    return data[getDataKey]
  }

  getField() {
    if (this.options.date) {
      return Field.history()
    }

    if (this.type === 'index') {
      return Field.stockIndex()
    }

    return Field.basic(this.options)
  }

  getStockUrl() {
    if (!this.code && !this.options.favorite && !this.options.date) {
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
    }

    if (this.options.favorite) {
      if (this.favorite.checkFavoriteNotExistStock()) {
        console.log(Text.red('Your favorite list not have any stock.'))

        return
      }

      const favoriteUrl = this.favorite.getFavoriteStocksUrl()

      return `${this.prefix}${favoriteUrl}`
    }

    if (this.options.date) {
      const date = StockURL.getConversionDate(
        this.options.date,
        this.options.listed
      )

      if (typeof date == 'string') {
        return
      } else {
        this.date = date
        this.dateExistDay = this.date.length == 3

        if (!this.dateExistDay) {
          this.date.push('01')
        }
      }

      return StockURL.getStockAPIWithDate(
        this.code,
        this.date.join(this.options.listed == 'otc' ? '/' : ''),
        this.options.listed
      )
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
