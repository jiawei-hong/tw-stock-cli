import axios from 'axios'
import { Table } from 'console-table-printer'
import { getStock, getStockWithDate } from '../url/index'
import Field from '../field'
import FilePath from '../lib/FilePath'
import { displayFailed } from '../lib/Text'
import { strIsNanHandle } from '../lib/Stock'
import { StockOptionProps } from '..'
import { StockPayload, StockResponse, TStock } from '../types/stock'
import {
  STOCK_NOT_FOUND,
  STOCK_NOT_FOUND_FILE,
  STOCK_QUERY_DATE_NOT_FOUND_TRADE,
  STOCK_SEARCH_BUT_NOT_GIVE_CODE,
} from '../message/Stock'
import { FAVORITE_NOT_FOUND } from '../message/Favorite'
import { getTaiwanDateFormat, getConversionDate } from '../utils/stock'

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

  execute() {
    if (this.url) {
      axios
        .get(this.url)
        .then((res) => {
          const data = this.getStockData(res.data)

          if (typeof data === 'string') {
            if (Array.isArray(data)) {
              displayFailed(STOCK_NOT_FOUND)
            } else {
              displayFailed(data)
            }
          } else {
            for (let stock of data) {
              let stockField: { [key: string]: string } = {}

              if (this.dateExistDay) {
                const searchDay = getTaiwanDateFormat(this.date.slice(0))
                if (typeof stock === 'string') {
                  if (searchDay != stock[0]) continue
                }
              }

              this.getField().forEach((field) => {
                const code = field.code

                if (code) {
                  if (this.notExecIsNanHandle.includes(code)) {
                    stockField[field.name] = stock[code as keyof typeof stock]
                  } else {
                    stockField[field.name] = strIsNanHandle(
                      stock[code as keyof typeof stock]
                    )
                  }
                }

                if (typeof stock !== 'string' && field.callback) {
                  stockField[field.name] = field.callback(stock)
                }
              })

              if (
                typeof stock !== 'string' &&
                'ex' in stock &&
                stock.ex == 'otc'
              ) {
                delete stockField.漲停
                delete stockField.跌停
              }

              this.table.addRow(stockField)
            }

            if (this.table.table.rows.length > 0) {
              this.table.printTable()
            } else {
              displayFailed(STOCK_QUERY_DATE_NOT_FOUND_TRADE)
            }
          }
        })
        .catch((err) => displayFailed(err))
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
          this.code,
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
