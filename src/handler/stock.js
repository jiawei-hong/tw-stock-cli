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
    this.options = Object.assign(params.options, { type: '' })
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

    if (!this.code && !this.options.favorite && !this.options.date) {
      console.log(Text.red('Please enter stock code.'))

      return
    }

    this.url = this.getStockUrl()
  }

  execute() {
    this.initialize()

    if (this.url) {
      axios.get(this.url).then((res) => {
        const data = this.getStockData(res.data)
        const dataTypeIsString = typeof data === 'string'

        if (dataTypeIsString || data.length === 0) {
          console.log(Text.red(dataTypeIsString ? data : 'Not found stock'))
        } else {
          for (let stock of data) {
            let stockField = {}

            if (this.dateExistDay) {
              const searchDay = StockURL.getTaiwanDateFormat(this.date.slice(0))

              if (searchDay != stock[0]) continue
            }

            this.getField().forEach((field) => {
              const code = field.code

              stockField[field.name] = this.notExecIsNanHandle.includes(code)
                ? stock[code]
                : Text.strIsNanHandle(stock[code])

              if (field.callback) {
                stockField[field.name] = field.callback(stock)
              }
            })

            if (stock.ex == 'otc') {
              delete stockField.漲停
              delete stockField.跌停
            }

            this.p.addRow(stockField)
          }

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
      return 'Query date is greater than today,please check again!'
    }

    return data[getDataKey]
  }

  getField() {
    if (this.options.date) {
      return Field.history()
    }

    if (this.options.type === 'index') {
      return Field.stockIndex()
    }

    return Field.basic(this.options)
  }

  getStockUrl() {
    if (this.options.multiple) {
      this.stocks = this.getAllStockCategory()

      let stock = []

      for (let stockCode of this.code.split('-')) {
        if (!stockCode) {
          return
        }

        stockCode = stockCode.toUpperCase()
        let stockCategory = this.getStockCategory(stockCode)

        if (stockCategory != 'tse' || stockCategory != 'otc') {
          console.log(Text.red(stockCategory))
        } else {
          stock.push(`${stockCategory}_${stockCode}.tw`)
        }
      }

      if (stock.length > 0) {
        return `${this.prefix}${stock.join('|')}`
      }
    }

    if (this.options.favorite) {
      if (this.favorite.checkFavoriteNotExistStock()) {
        console.log(Text.red('Your favorite list not have any stock.'))
      } else {
        const favoriteUrl = this.favorite.getFavoriteStocksUrl()

        return `${this.prefix}${favoriteUrl}`
      }
    }

    if (this.options.date) {
      const date = StockURL.getConversionDate(
        this.options.date,
        this.options.listed
      )

      if (typeof date != 'string') {
        this.date = date
        this.dateExistDay = this.date.length == 3

        if (!this.dateExistDay) {
          this.date.push('01')
        }

        return StockURL.getStockAPIWithDate(
          this.code,
          this.date.join(this.options.listed == 'otc' ? '/' : ''),
          this.options.listed
        )
      }
    }

    return `${this.prefix}${this.options.listed}_${this.code.toUpperCase()}.tw`
  }

  getAllStockCategory() {
    return JSON.parse(fs.readFileSync(this.stockCategoryPath), 'utf8')
  }

  getStockCategory(code) {
    const stock = this.stocks[code]

    return stock?.category
  }

  checkStockFileExist() {
    return fs.existsSync(this.stockCategoryPath)
  }
}

module.exports = Stock
