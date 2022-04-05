const axios = require('axios').default
const fs = require('fs')
const { Table } = require('console-table-printer')
const Text = require('../lib/text')
const StockURL = require('../url/index')
const Field = require('../field')
const { StockMessage, FavoriteMessage } = require('../message')
const FilePath = require('../lib/filePath')

class Stock {
  constructor(params) {
    this.prefix = StockURL.getStockAPI(params.options.oddlot)
    this.url = ''
    this.stocks = []
    this.code = params.code
    this.options = Object.assign(params.options, { type: '' })
    this.notExecIsNanHandle = ['c', 'ex', 'n', 't', 0, 1, 2, 7, 8]
    this.p = new Table({ columns: this.getField() })
    this.date = []
    this.dateExistDay = false
    this.stockCategory = ['tse', 'otc']
    this.message = ''
  }

  initialize() {
    if (!this.code && !this.options.favorite && !this.options.date) {
      this.message = StockMessage.notInputCode()
    } else if (this.options.multiple && !FilePath.stock.exist()) {
      this.message = StockMessage.notFoundStockFile()
    } else if (this.options.favorite && !FilePath.favorite.exist()) {
      this.message = FavoriteMessage.notFoundFavortieFile()
    }

    if (this.message) {
      console.log(this.message)
    } else {
      this.url = this.getStockUrl()
    }
  }

  execute() {
    this.initialize()

    if (this.url) {
      axios.get(this.url).then((res) => {
        const data = this.getStockData(res.data)

        if (data.length === 0 || typeof data === 'string') {
          if (Array.isArray(data)) {
            console.log(StockMessage.notFound())
          } else {
            console.log(Text.red(data))
          }
        } else {
          for (let stock of data) {
            let stockField = {}

            if (this.dateExistDay) {
              const searchDay = StockURL.getTaiwanDateFormat(this.date.slice(0))

              if (searchDay != stock[0]) continue
            }

            this.getField().forEach((field) => {
              const code = field.code

              if (this.notExecIsNanHandle.includes(code)) {
                stockField[field.name] = stock[code]
              } else {
                stockField[field.name] = Text.strIsNanHandle(stock[code])
              }

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

          if (this.p.table.rows.length > 0) {
            if (this.options.date) {
              console.log(StockMessage.searchStock(this.code))
            }

            this.p.printTable()
          } else {
            console.log(StockMessage.queryDateNotFoundTrade())
          }
        }
      })
    }
  }

  getStockData(data) {
    const dataField = ['data', 'aaData', 'msgArray']
    const getDataKey = Object.keys(data).find((key) => dataField.includes(key))

    if (Object.keys(data).includes('stat') && data['stat'] != 'OK') {
      return data['stat']
    }

    if (!getDataKey) {
      return StockMessage.notFound()
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
    if (this.options.multiple || this.options.favorite) {
      const data = this.options.multiple
        ? this.code.split('-')
        : FilePath.favorite.read().stockCodes
      this.stocks = FilePath.stock.read()

      let stock = this.getMultipleStock(data)

      if (stock.length > 0) {
        return `${this.prefix}${stock.join('|')}`
      }

      if (this.options.multiple) {
        console.log(StockMessage.notFound())
      } else {
        console.log(FavoriteMessage.notFound())
      }

      return
    }

    if (this.options.date) {
      const date = StockURL.getConversionDate(
        this.options.date,
        this.options.listed
      )

      if (Array.isArray(date)) {
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

      return date
    }

    return `${this.prefix}${this.options.listed}_${this.code.toUpperCase()}.tw`
  }

  getMultipleStock(data) {
    return data
      .map((code) => {
        code = code.toUpperCase()

        const stockMarket = this.getStockCategory(code)

        if (this.stockCategory.includes(stockMarket)) {
          return `${stockMarket}_${code}.tw`
        }
      })
      .filter((code) => code !== undefined)
  }

  getStockCategory(code) {
    const stock = this.stocks[code]

    return stock?.category
  }
}

module.exports = Stock
