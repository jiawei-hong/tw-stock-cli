const fs = require('fs')
const path = require('path')
const { Table } = require('console-table-printer')
const { StockMessage, FavoriteMessage } = require('../message')

class Favorite {
  constructor(params) {
    this.data = []
    this.code = params.code ?? ''
    this.options = params?.options || {}
    this.path = path.resolve(`${__dirname}/../favorite.json`)
    this.stockCategoryPath = path.resolve(`${__dirname}/../stock.json`)
    this.stockCategory = []
    this.p = new Table({
      columns: [
        { name: '公司簡稱', alignment: 'left' },
        { name: '股票代碼', alignment: 'left' },
      ],
    })
    this.message = ''
  }

  initialize() {
    if (!this.checkExistFavoriteFile() && !this.options.create) {
      this.message = FavoriteMessage.notFoundFavortieFile()
    } else if (!this.checkExistStockCategoryFile()) {
      this.message = StockMessage.notFoundStockFile()
    }

    if (this.message) {
      console.log(this.message)

      return
    }

    if (!this.options.create) {
      this.data = JSON.parse(fs.readFileSync(this.path, 'utf-8')).stockCodes

      this.stockCategory = JSON.parse(
        fs.readFileSync(this.stockCategoryPath, 'utf-8')
      )
    }
  }

  getFavoriteStocksUrl() {
    this.initialize()

    return this.data
      .map((stockCode) => {
        let data = this.stockCategory[stockCode]

        return `${data.category}_${stockCode}.tw`
      })
      .join('|')
  }

  execute() {
    this.initialize()

    if (Object.keys(this.options).length === 0) {
      this.data.forEach((stockCode) => {
        const stock = this.stockCategory[stockCode]

        this.p.addRow({
          公司簡稱: stock.name,
          股票代碼: stockCode,
        })
      })

      this.p.printTable()
    } else if (this.options.create) {
      fs.writeFileSync(this.path, JSON.stringify({ stockCodes: this.data }))

      console.log(FavoriteMessage.createFileSuccessfully())
    } else if (this.options.add) {
      this.add(this.code.toUpperCase())
    } else if (this.options.delete) {
      this.delete(this.code.toUpperCase())
    }
  }

  checkExistFavoriteFile() {
    return fs.existsSync(this.path)
  }

  checkExistStockCategoryFile() {
    return fs.existsSync(this.stockCategoryPath)
  }

  checkFavoriteNotExistStock() {
    this.initialize()

    return this.data.length === 0
  }

  add(stockCode) {
    const stock = this.stockCategory[stockCode]
    const stockExistInFavorite = this.data.indexOf(stockCode) !== -1

    if (stockExistInFavorite) {
      console.log(FavoriteMessage.stockCodeIsExistFavorite(stockCode))

      return
    }

    if (stock) {
      this.data.push(stockCode)
      fs.writeFileSync(this.path, JSON.stringify({ stockCodes: this.data }))

      console.log(FavoriteMessage.addCodeSuccssfuilly(stockCode))
    } else {
      console.log(StockMessage.notFoundStockCode(stockCode))
    }
  }

  delete(stockCode) {
    const idx = this.data.indexOf(stockCode)

    if (idx == -1) {
      console.log(FavoriteMessage.notFoundStockCodeInFavorite(stockCode))
    } else {
      this.data.splice(idx, 1)
      fs.writeFileSync(this.path, JSON.stringify({ stockCodes: this.data }))

      console.log(FavoriteMessage.deleteCodeSuccessfully(stockCode))
    }
  }
}

module.exports = Favorite
