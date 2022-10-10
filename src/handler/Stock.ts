import axios from 'axios'
import { Table } from 'console-table-printer'

import { color } from '../color'
import Field from '../field'
import FilePath from '../lib/FilePath'
import { strIsNanHandle } from '../lib/Stock'
import { displayFailed } from '../lib/Text'
import { FAVORITE_NOT_FOUND } from '../message/Favorite'
import {
  STOCK_NOT_FOUND,
  STOCK_NOT_FOUND_FILE,
  STOCK_QUERY_DATE_NOT_FOUND_TRADE,
  STOCK_SEARCH_BUT_NOT_GIVE_CODE,
} from '../message/Stock'
import { StockOptionProps } from '../types/stock'
import { StockPayload, StockResponse, TStock } from '../types/stock'
import { getStock, getStockWithDate } from '../url/index'
import { toUppercase } from '../utils'
import { getConversionDate, getTaiwanDateFormat } from '../utils/stock'

interface Stock {
  code: string
  url: string
  prefix: string
  stocks: StockPayload
  options: StockOptionProps
  notExecIsNanHandle: (string | number)[]
  table: Table
  date: string[]
  dateExistDay: boolean
  stockCategory: string[]
}

class Stock {
  constructor(code: string, options: StockOptionProps) {
    this.prefix = getStock(options.oddLot ?? false)
    this.url = ''
    this.code = code
    this.options = options
    this.notExecIsNanHandle = ['c', 'ex', 'n', 't', '0', '1', '2', '7', '8']
    this.table = new Table({ columns: this.getField() })
    this.date = []
    this.dateExistDay = false
    this.stockCategory = ['tse', 'otc']
    this.stocks = FilePath.stock.read()
  }

  initialize() {
    if (!this.code && !this.options.favorite && !this.options.date) {
      return displayFailed(STOCK_SEARCH_BUT_NOT_GIVE_CODE)
    }
    if (this.options.multiple && !FilePath.stock.exist()) {
      return displayFailed(STOCK_NOT_FOUND_FILE)
    }
    if (this.options.favorite && !FilePath.favorite.exist()) {
      return displayFailed(FAVORITE_NOT_FOUND)
    }

    this.url = this.getStockUrl()
    this.execute()
  }

  getStock() {
    if (this.url) {
      return axios
        .get(this.url)
        .then((res) => res.data)
        .catch((err) => displayFailed(err))
    }
    return null
  }

  async execute() {
    const stocks = this.getStockData(await this.getStock())

    if (typeof stocks === 'string') {
      displayFailed(Array.isArray(stocks) ? STOCK_NOT_FOUND : stocks)
      return
    }

    for (let stock of stocks) {
      if (this.dateExistDay) {
        const searchDay = getTaiwanDateFormat(this.date.slice(0))
        if (typeof stock === 'string') {
          if (searchDay != stock[0]) continue
        }
      }

      let stockField: { [key: string]: string } = this.getField()
        .map((field) => {
          const stockCode = field.code
          const isExistNotInExecIsNanHandle = this.notExecIsNanHandle.includes(
            stockCode ?? ''
          )
          const stockInformation = stock[stockCode as keyof typeof stockCode]
          let stockTrade = isExistNotInExecIsNanHandle
            ? stockInformation
            : strIsNanHandle(stockInformation)

          if (typeof stock !== 'string' && field.callback) {
            stockTrade = field.callback(stock)
          }

          if (
            typeof stock !== 'string' &&
            'ex' in stock &&
            stock.ex == 'otc' &&
            ['漲停', '跌停'].includes(field.name)
          ) {
            return { [field.name]: `${color.rest}-` }
          }

          return {
            [field.name]: stockTrade,
          }
        })
        .reduce((acc, cur) => Object.assign(acc, cur), {})

      this.table.addRow(stockField)
    }
    this.printTable()
  }

  printTable() {
    if (this.table.table.rows.length > 0) {
      this.table.printTable()
    } else {
      displayFailed(STOCK_QUERY_DATE_NOT_FOUND_TRADE)
    }
  }

  getStockData(data: StockResponse): string | TStock[] | string[] {
    const dataField = ['data', 'aaData', 'msgArray']
    const getDataKey = Object.keys(data).find((key) => dataField.includes(key))

    if ('stat' in data && data['stat'] != 'OK') {
      return data['stat'] as string
    }

    if (!getDataKey) {
      displayFailed(STOCK_NOT_FOUND)
    }

    return data[getDataKey as keyof typeof data]
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

  getStockUrl(): string {
    if (this.options.multiple || this.options.favorite) {
      const isFavoriteMode = this.options.favorite
      const data = isFavoriteMode
        ? FilePath.favorite.read().stockCodes
        : this.code?.split('-').map(toUppercase)
      let stock = this.getMultipleStock(data)

      if (stock.length > 0) {
        return `${this.prefix}${stock.join('|')}`
      }

      if (this.options.multiple) {
        displayFailed(STOCK_NOT_FOUND)
      } else {
        displayFailed(FAVORITE_NOT_FOUND)
      }
    } else if (this.options.date) {
      const date = getConversionDate(this.options.date, this.options.listed)

      if (Array.isArray(date)) {
        this.date = date
        this.dateExistDay = this.date.length == 3

        if (!this.dateExistDay) {
          this.date.push('01')
        }

        return getStockWithDate(
          toUppercase(this.code),
          this.date.join(this.options.listed == 'otc' ? '/' : ''),
          this.options.listed ?? 'tse'
        )
      }

      return date
    }

    return `${this.prefix}${this.options.listed}_${toUppercase(this.code)}.tw`
  }

  getMultipleStock(data: string[]) {
    return data
      .map((code: string) => {
        const category = this.getCategory(code)

        return this.formatMultipleStock({
          isExistInCategory: this.checkExistCategory(category),
          category,
          code,
        })
      })
      .filter(Boolean)
  }

  checkExistCategory(category: string): boolean {
    return this.stockCategory.includes(category)
  }

  getCategory(code: string) {
    return this.stocks[code]?.category
  }

  formatMultipleStock({
    isExistInCategory,
    category,
    code,
  }: {
    isExistInCategory: boolean
    category: string
    code: string
  }) {
    return isExistInCategory ? `${category}_${code}.tw` : ''
  }
}

export default Stock
