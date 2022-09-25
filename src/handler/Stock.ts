import axios from 'axios'
import { Table } from 'console-table-printer'

import { StockOptionProps } from '..'
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
import { StockPayload, StockResponse, TStock } from '../types/stock'
import { getStock, getStockWithDate } from '../url/index'
import { getConversionDate, getTaiwanDateFormat } from '../utils/stock'

interface Stock {
  code: string | undefined
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
  constructor(code: string | undefined, options: StockOptionProps) {
    this.prefix = getStock(options.oddLot ?? false)
    this.url = ''
    this.code = code
    this.options = options
    this.notExecIsNanHandle = ['c', 'ex', 'n', 't', '0', '1', '2', '7', '8']
    this.table = new Table({ columns: this.getField() })
    this.date = []
    this.dateExistDay = false
    this.stockCategory = ['tse', 'otc']
  }

  initialize() {
    if (!this.code && !this.options.favorite && !this.options.date) {
      displayFailed(STOCK_SEARCH_BUT_NOT_GIVE_CODE)
    } else if (this.options.multiple && !FilePath.stock.exist()) {
      displayFailed(STOCK_NOT_FOUND_FILE)
    } else if (this.options.favorite && !FilePath.favorite.exist()) {
      displayFailed(FAVORITE_NOT_FOUND)
    } else {
      this.url = this.getStockUrl()
    }
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
      const data = this.options.multiple
        ? this.code?.split('-')
        : FilePath.favorite.read().stockCodes
      this.stocks = FilePath.stock.read()

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
          this.code?.toUpperCase(),
          this.date.join(this.options.listed == 'otc' ? '/' : ''),
          this.options.listed ?? 'tse'
        )
      }

      return date
    }

    return `${this.prefix}${this.options.listed}_${this.code?.toUpperCase()}.tw`
  }

  getMultipleStock(data: string[]) {
    return data
      .map((code: string) => {
        code = code.toUpperCase()

        const stockMarket = this.getStockCategory(code)

        if (this.stockCategory.includes(stockMarket)) {
          return `${stockMarket}_${code}.tw`
        }
      })
      .filter((code: string | undefined) => code !== undefined)
  }

  getStockCategory(code: string) {
    const stock = this.stocks[code]

    return stock?.category
  }
}

export default Stock
