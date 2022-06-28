import { TStock } from '../types/stock'
import { displayFailed } from './Text'

function getStockUpsAndDownsPercentage(stock: TStock) {
  let [yesterdayPrice, currentPrice] = [stock.y, stock.z]

  return getDecimalString(
    strIsNanHandle(
      ((parseFloat(currentPrice) - parseFloat(yesterdayPrice)) /
        parseFloat(yesterdayPrice)) *
        100
    )
  )
}

function category2Chinese(category: 'tse' | 'otc') {
  const categories = ['tse', 'otc']
  const categoryLowerCase = category.toLowerCase()

  if (!categories.includes(categoryLowerCase)) {
    return displayFailed(`${category} not found chinese word.`)
  }

  return categoryLowerCase == 'tse' ? '上市' : '上櫃'
}

function getDecimalString(text: string | number, point = 2) {
  if (typeof text === 'number') {
    return text.toFixed(point).toString()
  }

  return parseFloat(text).toFixed(point).toString()
}

function strIsNanHandle(text: string | number): string {
  return isNaN(Number(text)) ? '-' : getDecimalString(text)
}

function percentageHandle(num: string) {
  return `${parseFloat(num)}%`
}

export {
  getStockUpsAndDownsPercentage,
  category2Chinese,
  getDecimalString,
  strIsNanHandle,
  percentageHandle,
}
