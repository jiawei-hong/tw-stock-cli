import { FAVORITE_NOT_FOUND } from '@/messages/favorite'
import {
  STOCK_NOT_FOUND,
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

  constructor(code: string | undefined, options: StockOptionProps) {
    this.code = code ?? ''
    this.prefix = getStock(options.oddLot || false)
    this.options = options
  }

  initialize() {
    if (!this.code && !this.options.favorite) {
      return displayFailed(STOCK_SEARCH_BUT_NOT_GIVE_CODE)
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
    const query = await generateGetStockURL(this.getStocks())
    if (!query) {
      return displayFailed('Your favorites list is empty; add a stock first.')
    }
    const url = `${this.prefix}${query}`

    const response = await fetchStockData(url)
    const stocks = extractStockData(response)

    if (typeof stocks === 'string') {
      return displayFailed(this.getUnavailableMessage(stocks))
    }

    if (!stocks || stocks.length === 0) {
      return displayFailed(this.getUnavailableMessage(STOCK_NOT_FOUND))
    }

    const fields = Field.basic(this.options)
    renderStockTable(stocks as TStock[], fields)
  }

  private getUnavailableMessage(reason: string): string {
    if (this.options.multiple || this.options.favorite || !this.code) {
      return reason
    }

    const market = this.options.listed
      ? ` on ${this.options.listed.toUpperCase()}`
      : ' on TSE or OTC'
    return `${reason} No current quote matched "${this.code}"${market}. Try tw-stock stock --search ${this.code} to verify the symbol or company name.`
  }
}

export default RealtimeStock
