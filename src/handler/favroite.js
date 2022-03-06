const fs = require('fs')
const path = require('path')
const Text = require('../lib/text')
const { Table } = require('console-table-printer')

class Favorite {
  constructor(params) {
    this.data = []
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
  }

  initialize() {
    if (!this.checkExistFavoriteFile() && !this.options.create) {
      console.log(
        Text.red(
          'If you want use favroite command, plz first create favorite file.'
        )
      )

      return
    }

    if (!this.checkExistStockCategoryFile()) {
      console.log(
        Text.red(
          'If you want use favroite command, plz first run update command.'
        )
      )

      return
    }

    if (!this.options.create) {
      this.data = JSON.parse(fs.readFileSync(this.path, 'utf-8')).stockCodes

      this.stockCategory = JSON.parse(
        fs.readFileSync(this.stockCategoryPath, 'utf-8')
      )
    }
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

      console.log(Text.green('Create favorite file successfully.'))
    } else if (this.options.add) {
      this.add(this.options.add.toUpperCase())
    } else if (this.options.delete) {
      this.delete(this.options.delete.toUpperCase())
    }
  }

  checkExistFavoriteFile() {
    return fs.existsSync(this.path)
  }

  checkExistStockCategoryFile() {
    return fs.existsSync(this.stockCategoryPath)
  }

  add(stockCode) {
    const stock = this.stockCategory[stockCode]
    const stockExistInFavorite = this.data.indexOf(stockCode) !== -1

    if (stockExistInFavorite) {
      console.log(Text.red(`${stockCode} code is exist in favorite list.`))

      return
    }

    if (stock) {
      this.data.push(stockCode)
      fs.writeFileSync(this.path, JSON.stringify({ stockCodes: this.data }))

      console.log(Text.green(`${stockCode} add successfully.`))
    } else {
      console.log(Text.red(`Not found ${stockCode} stock code.`))
    }
  }

  delete(stockCode) {
    const idx = this.data.indexOf(stockCode)

    if (idx == -1) {
      console.log(
        Text.red(`Not fonud ${stockCode} stock in your favroite list.`)
      )
    } else {
      this.data.splice(idx, 1)
      fs.writeFileSync(this.path, JSON.stringify({ stockCodes: this.data }))

      console.log(Text.green(`${stockCode} delete successfully.`))
    }
  }
}

module.exports = Favorite
