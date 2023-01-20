import { table } from 'table'

import FilePath from '../lib/FilePath'
import { displayFailed, displaySuccess } from '../lib/Text'
import {
  FAVORITE_ADD_STOCK,
  FAVORITE_CREATE_FILE,
  FAVORITE_DELETE_STOCK,
  FAVORITE_IS_EXIST,
  FAVORITE_NOT_FOUND,
  FAVORITE_NOT_FOUND_STOCK_IN_FILE,
  FAVORITE_STOCK_IS_EXIST,
} from '../message/Favorite'
import { STOCK_NOT_FOUND_FILE } from '../message/Stock'
import { FavoriteOptionProps } from '../types/favorite'
import { StockPayload } from '../types/stock'
import { tableConfig } from '../utils/table'

type FavoriteProps = {
  code: string | undefined
  options: FavoriteOptionProps
}

interface Favorite {
  code: string | undefined
  data: string[]
  message: string
  options: FavoriteOptionProps
  stocks: StockPayload
}

class Favorite {
  constructor(params: FavoriteProps) {
    this.code = params.code
    this.options = params.options
    this.data = []
  }

  initialize() {
    if (!this.options.create) {
      if (FilePath.stock.exist()) {
        this.stocks = FilePath.stock.read()
      }

      if (FilePath.favorite.exist()) {
        this.data = FilePath.favorite.read()?.stockCodes
      }
    }
    this.execute()
  }

  execute() {
    if (!FilePath.stock.exist()) {
      displayFailed(STOCK_NOT_FOUND_FILE)
    } else if (!FilePath.favorite.exist() && !this.options.create) {
      displayFailed(FAVORITE_NOT_FOUND)
    } else if (this.options.create) {
      if (FilePath.favorite.exist()) {
        displayFailed(FAVORITE_IS_EXIST)
      } else {
        FilePath.favorite.write({ stockCodes: [] })

        displaySuccess(FAVORITE_CREATE_FILE)
      }
    } else if (this.options.add) {
      if (this.code) {
        this.add(this.code.toUpperCase())
      }
    } else if (this.options.delete) {
      if (this.code) {
        this.delete(this.code.toUpperCase())
      }
    } else {
      const dataRows = this.data.map((stockCode) => {
        const stock = this.stocks[stockCode]

        return [stock.name, stockCode]
      })
      let stockInformation = [['公司簡稱', '股票代碼'], ...dataRows]
      console.log(table(stockInformation, tableConfig))
    }
  }

  add(stockCode: string) {
    const stock = this.stocks[stockCode]
    const stockExistInFavorite = this.data.includes(stockCode)

    if (stockExistInFavorite) {
      displayFailed(FAVORITE_STOCK_IS_EXIST)
    } else if (stock) {
      this.data.push(stockCode)

      FilePath.favorite.write({ stockCodes: this.data })

      displaySuccess(FAVORITE_ADD_STOCK)
    } else {
      displayFailed(FAVORITE_NOT_FOUND_STOCK_IN_FILE)
    }
  }

  delete(stockCode: string) {
    if (!this.data.includes(stockCode)) {
      displayFailed(FAVORITE_NOT_FOUND_STOCK_IN_FILE)
    } else {
      const idx = this.data.indexOf(stockCode)

      this.data.splice(idx, 1)
      FilePath.favorite.write({ stockCodes: this.data })

      displaySuccess(FAVORITE_DELETE_STOCK)
    }
  }
}

export default Favorite
