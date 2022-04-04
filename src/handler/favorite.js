const Stock = require('./stock')
const FilePath = require('../lib/filePath')
const { readFileSync, writeFileSync } = require('../lib/file')
const { Table } = require('console-table-printer')
const { StockMessage, FavoriteMessage } = require('../message')

class Favorite extends Stock {
  constructor(params) {
    super(params)
    this.data = []
    this.p = new Table({
      columns: [
        { name: '公司簡稱', alignment: 'left' },
        { name: '股票代碼', alignment: 'left' },
      ],
    })
  }

  initialize() {
    if (!this.chekckFavoriteFileExist() && !this.options.create) {
      this.message = FavoriteMessage.notFoundFavortieFile()
    } else if (!this.checkStockFileExist()) {
      this.message = StockMessage.notFoundStockFile()
    }

    if (this.message) {
      console.log(this.message)

      return
    }

    if (!this.options.create) {
      this.data = readFileSync(FilePath.favorite).stockCodes

      this.stocks = this.getAllStockCategory()
    }
  }

  execute() {
    this.initialize()

    if (this.options.create) {
      writeFileSync(FilePath.favorite, { stockCodes: [] })

      console.log(FavoriteMessage.createFileSuccessfully())
    } else if (this.options.add) {
      this.add(this.code.toUpperCase())
    } else if (this.options.delete) {
      this.delete(this.code.toUpperCase())
    } else {
      const dataRows = this.data.map((stockCode) => {
        const stock = this.stocks[stockCode]

        return {
          公司簡稱: stock.name,
          股票代碼: stockCode,
        }
      })

      this.p.addRows(dataRows)
      this.p.printTable()
    }
  }

  add(stockCode) {
    const stock = this.stocks[stockCode]
    const stockExistInFavorite = this.data.indexOf(stockCode) !== -1

    if (stockExistInFavorite) {
      console.log(FavoriteMessage.stockCodeIsExistFavorite(stockCode))

      return
    }

    if (stock) {
      this.data.push(stockCode)

      writeFileSync(FilePath.favorite, { stockCodes: this.data })

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
      writeFileSync(FilePath.favorite, { stockCodes: this.data })

      console.log(FavoriteMessage.deleteCodeSuccessfully(stockCode))
    }
  }
}

module.exports = Favorite
