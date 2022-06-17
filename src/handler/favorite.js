const Stock = require('./stock')
const FilePath = require('../lib/filePath')
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
    if (!FilePath.favorite.exist() && !this.options.create) {
      this.message = FavoriteMessage.notFoundFavortieFile()
    } else if (!FilePath.stock.exist()) {
      this.message = StockMessage.notFoundStockFile()
    } else if (!this.options.create) {
      this.data = FilePath.favorite.read().stockCodes
      this.stocks = FilePath.stock.read()
    }
  }

  execute() {
    this.initialize()

    if (this.message) {
      console.log(this.message);

      return;
    }

    if (this.options.create) {
      if (FilePath.favorite.exist()) {
        console.log(FavoriteMessage.isExist())
      } else {
        FilePath.favorite.write({ stockCodes: [] })

        console.log(FavoriteMessage.createFileSuccessfully())
      }
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

      FilePath.favorite.write({ stockCodes: this.data })

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
      FilePath.favorite.write({ stockCodes: this.data })

      console.log(FavoriteMessage.deleteCodeSuccessfully(stockCode))
    }
  }
}

module.exports = Favorite
