import { FAVORITE_NOT_FOUND } from '@/messages/favorite'
import {
  SOMETHING_WRONG,
  STOCK_NOT_FOUND,
  STOCK_NOT_FOUND_FILE,
  STOCK_SEARCH_BUT_NOT_GIVE_CODE,
} from '@/messages/stock'
import { Category, StockOptionProps, TStock } from '@/types/stock'
import FilePath from '@/utils/file'
import { displayFailed } from '@/utils/text'

import { getStock as fetchStockData } from './api'
import Field from './field'
import { renderStockTable } from './render'
import { extractStockData } from './response'
import { getStock } from './url'
import { generateGetStockURL } from './utils'

class RealtimeStock {
  private code: string
  private prefix: string
  private options: StockOptionProps

  constructor(code: string, options: StockOptionProps) {
    this.code = code
    this.prefix = getStock(options.oddLot || false)
    this.options = options
  }

  initialize() {
    if (!this.code && !this.options.favorite) {
      return displayFailed(STOCK_SEARCH_BUT_NOT_GIVE_CODE)
    }
    if (this.options.multiple && !FilePath.stock.exist()) {
      return displayFailed(STOCK_NOT_FOUND_FILE)
    }
    if (this.options.favorite && !FilePath.favorite.exist()) {
      return displayFailed(FAVORITE_NOT_FOUND)
    }
    this.execute().catch((err) => displayFailed(String(err)))
  }

  getStocks(): { stocks: string | string[]; listed?: Category } {
    if (this.options.multiple) {
      return { stocks: this.code?.split('-') }
    }
    if (this.options.favorite) {
      return { stocks: FilePath.favorite.read().stockCodes }
    }
    return { stocks: this.code, listed: this.options.listed }
  }

  async execute() {
    const url = `${this.prefix}${generateGetStockURL(this.getStocks())}`
    if (!url) {
      return displayFailed(SOMETHING_WRONG)
    }

    const response = await fetchStockData(url)
    const stocks = extractStockData(response)

    if (typeof stocks === 'string') {
      return displayFailed(stocks)
    }

    if (!stocks || stocks.length === 0) {
      return displayFailed(STOCK_NOT_FOUND)
    }

    const fields = Field.basic(this.options)
    renderStockTable(stocks as TStock[], fields)
  }
}

export default RealtimeStock
