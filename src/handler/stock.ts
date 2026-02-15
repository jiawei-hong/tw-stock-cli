import { table } from 'table'

import { getStock as getStockData } from '@/api/stocks'
import { color } from '@/color'
import Field from '@/field'
import FilePath from '@/lib/file-path'
import { convertToPercentage, shouldConvertToPercentage } from '@/lib/stock'
import { displayFailed } from '@/lib/text'
import { FAVORITE_NOT_FOUND } from '@/message/favorite'
import {
  SOMETHING_WRONG,
  STOCK_NOT_FOUND,
  STOCK_NOT_FOUND_FILE,
  STOCK_SEARCH_BUT_NOT_GIVE_CODE,
} from '@/message/stock'
import {
  Category,
  StockOptionProps,
  StockResponse,
  TStock,
} from '@/types/stock'
import { getStock, getStockWithDate } from '@/url/index'
import { toUppercase } from '@/utils'
import { getTableHeader } from '@/utils'
import {
  generateGetStockURL,
  getConversionDate,
  getTaiwanDateFormat,
} from '@/utils/stock'
import { tableConfig } from '@/utils/table'

interface Stock {
  code: string
  url: string
  prefix: string
  options: StockOptionProps
  date: string[]
  dateExistDay: boolean
}

class Stock {
  constructor(code: string, options: StockOptionProps) {
    this.prefix = getStock(options.oddLot || false)
    this.url = ''
    this.code = code
    this.options = options
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
    const getDateWithTWFormat = getTaiwanDateFormat(this.date.slice(0))
    return stocks.filter((stock) => stock[0] === getDateWithTWFormat)
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

  getStockUrl() {
    if (this.options.type === 'index') {
      return this.url
    }

    if (this.options.date) {
      this.getStockURLWithSearchDate()
    }

    return `${this.prefix}${generateGetStockURL(this.getStocks())}`
  }

  async execute() {
    const stockURL = this.getStockUrl()
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

    const stockField = this.getField()
    let tableInformation = [getTableHeader(stockField)]

    for (let stock of stocks) {
      const stockInformation: string[] = stockField.map((field) => {
        const { code, name, callback } = field
        let trade = this.getTrade(stock, code ?? '')

        if (typeof stock !== 'string') {
          if (typeof callback === 'function') {
            trade = callback(stock)
          }
          if (stock.ex === 'otc' && ['漲停', '跌停'].includes(name)) {
            return `${color.rest}-`
          }
        }
        return trade
      })
      tableInformation.push(stockInformation)
    }

    if (tableInformation.length === 1) {
      return displayFailed(STOCK_NOT_FOUND)
    }
    console.log(table(tableInformation, tableConfig))
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

  getTrade(stock: TStock | string, fieldCode: string) {
    const fieldValue = stock[fieldCode as keyof typeof stock]
    return shouldConvertToPercentage(fieldValue)
      ? convertToPercentage(fieldValue)
      : fieldValue
  }
}

export default Stock
