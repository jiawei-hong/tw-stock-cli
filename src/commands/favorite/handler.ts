import {
  FAVORITE_ADD_STOCK,
  FAVORITE_CREATE_FILE,
  FAVORITE_DELETE_STOCK,
  FAVORITE_IS_EXIST,
  FAVORITE_NOT_FOUND,
  FAVORITE_NOT_FOUND_STOCK_IN_FILE,
  FAVORITE_STOCK_IS_EXIST,
} from '@/messages/favorite'
import { getMarketSymbols } from '@/services/market-symbols'
import { StockPayload } from '@/types/stock'
import FilePath from '@/utils/file'
import { responsiveTable } from '@/utils/table'
import { displayFailed, displaySuccess } from '@/utils/text'

type Action = 'create' | 'add' | 'delete' | 'list'

interface Favorite {
  action: Action
  code: string | undefined
  data: string[]
  stocks: StockPayload
}

class Favorite {
  constructor(action: Action, code?: string) {
    this.action = action
    this.code = code
    this.data = []
  }

  async initialize() {
    if (this.action !== 'create') {
      if (FilePath.favorite.exist()) {
        this.data = FilePath.favorite.read()?.stockCodes
      }
    }
    try {
      await this.execute()
    } catch (error) {
      displayFailed(String(error))
    }
  }

  async execute() {
    if (!FilePath.favorite.exist() && this.action !== 'create') {
      displayFailed(FAVORITE_NOT_FOUND)
    } else if (this.action === 'create') {
      if (FilePath.favorite.exist()) {
        displayFailed(FAVORITE_IS_EXIST)
      } else {
        FilePath.favorite.write({ stockCodes: [] })
        displaySuccess(FAVORITE_CREATE_FILE)
      }
    } else if (this.action === 'add') {
      if (this.code) {
        if (this.data.includes(this.code.toUpperCase())) {
          return displayFailed(FAVORITE_STOCK_IS_EXIST)
        }
        this.stocks = await getMarketSymbols([this.code])
        this.add(this.code.toUpperCase())
      }
    } else if (this.action === 'delete') {
      if (this.code) {
        this.delete(this.code.toUpperCase())
      }
    } else {
      try {
        this.stocks = await getMarketSymbols(this.data)
      } catch (error) {
        displayFailed(`Names unavailable: ${String(error)}`)
        this.stocks = {}
      }
      const dataRows = this.data.map((stockCode) => {
        const stock = this.stocks[stockCode]
        return [stock?.name ?? '-', stockCode]
      })
      let stockInformation = [['公司簡稱', '股票代碼'], ...dataRows]
      console.log(responsiveTable(stockInformation, 0))
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
      displayFailed(
        'MIS could not resolve this stock code; favorite was not added.'
      )
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
