import { Table } from 'console-table-printer'

import { getStock as getStockData } from '../api/stocks'
import { color } from '../color'
import Field from '../field'
import FilePath from '../lib/FilePath'
import { convertToPercentage } from '../lib/Stock'
import { displayFailed } from '../lib/Text'
import { FAVORITE_NOT_FOUND } from '../message/Favorite'
import {
  SOMETHING_WRONG,
  STOCK_NOT_FOUND,
  STOCK_NOT_FOUND_FILE,
  STOCK_QUERY_DATE_NOT_FOUND_TRADE,
  STOCK_SEARCH_BUT_NOT_GIVE_CODE,
} from '../message/Stock'
import {
  Category,
  StockOptionProps,
  StockResponse,
  TStock,
} from '../types/stock'
import { getStock, getStockWithDate } from '../url/index'
import { toUppercase } from '../utils'
import {
  generateGetStockURL,
  getConversionDate,
  getTaiwanDateFormat,
} from '../utils/stock'

interface Stock {
  code: string
  url: string
  prefix: string
  options: StockOptionProps
  inexecutionToPercentage: (string | number)[]
  table: Table
  date: string[]
  dateExistDay: boolean
}

class Stock {
  constructor(code: string, options: StockOptionProps) {
    this.prefix = getStock(options.oddLot || false)
    this.url = ''
    this.code = code
    this.options = options
    this.inexecutionToPercentage = [
      'c',
      'ex',
      'n',
      't',
      '0',
      '1',
      '2',
      '7',
      '8',
    ]
    this.table = new Table({ columns: this.getField() })
    this.date = []
    this.dateExistDay = false
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
    this.execute()
  }

  shouldFilterSpecificDateStock(stocks: string[]) {
    const getDateWithTWForamt = getTaiwanDateFormat(this.date.slice(0))
    return stocks.filter((stock) => stock[0] === getDateWithTWForamt)
  }

  getStocks(): {
    stocks: string | string[]
    listed?: Category
  } {
    if (this.options.multiple) {
      return {
        stocks: this.code?.split('-'),
      }
    }

    if (this.options.favorite) {
      return {
        stocks: FilePath.favorite.read().stockCodes,
      }
    }

    return {
      stocks: this.code,
      listed: this.options.listed,
    }
  }

  getStockURLWithSearchDate() {
    const specificDate = getConversionDate(
      this.options.date ?? '',
      this.options.listed
    )
    if (Array.isArray(specificDate)) {
      this.date = specificDate
      const shouldRepairLostDay = this.date.length === 3
      this.dateExistDay = shouldRepairLostDay

      if (!shouldRepairLostDay) {
        this.date.push('01')
      }

      return getStockWithDate(
        toUppercase(this.code),
        this.date.join(this.options.listed == Category.OTC ? '/' : ''),
        this.options.listed ?? Category.TSE
      )
    }
    return ''
  }

  async execute() {
    const stockURL = this.options.date
      ? this.getStockURLWithSearchDate()
      : `${this.prefix}${generateGetStockURL(this.getStocks())}`
    if (!stockURL) {
      return displayFailed(SOMETHING_WRONG)
    }
    const datasets = await getStockData(stockURL)
    let stocks = this.getStockData(datasets)
    if (typeof stocks === 'string') {
      displayFailed(Array.isArray(stocks) ? STOCK_NOT_FOUND : stocks)
      return
    }

    if (this.options.date && this.dateExistDay) {
      stocks = this.shouldFilterSpecificDateStock(stocks as string[])
    }

    for (let stock of stocks) {
      const stockField: Record<string, string> = this.getField()
        .map((field) => {
          const { code, name, callback } = field
          let trade = this.getTrade(stock, code ?? '')

          if (typeof stock !== 'string') {
            if (typeof callback === 'function') {
              trade = callback(stock)
            }
            if (stock.ex === 'otc' && ['漲停', '跌停'].includes(name)) {
              return { [name]: `${color.rest}-` }
            }
          }

          return {
            [name]: trade,
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

  shouldConversionToPercentage(fieldCode: string) {
    return this.inexecutionToPercentage.includes(fieldCode)
  }

  getTrade(stock: TStock | string, fieldCode: string) {
    const fieldValue = stock[fieldCode as keyof typeof stock]
    return this.shouldConversionToPercentage(fieldValue)
      ? convertToPercentage(fieldValue)
      : fieldValue
  }
}

export default Stock
