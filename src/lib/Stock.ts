import { displayFailed, getDisplayActionText, Status } from './Text'

function getStockUpsAndDownsPercentage(
  yesterdayPrice: string,
  currentPrice: string
): string {
  const dec = getDecimalString(
    convertToPercentage(
      ((parseFloat(currentPrice) - parseFloat(yesterdayPrice)) /
        parseFloat(yesterdayPrice)) *
        100
    )
  )

  return getDisplayActionText(
    percentageHandle(dec),
    parseInt(dec) > 0 ? Status.success : Status.failed
  )
}

function category2Chinese(category: 'tse' | 'otc') {
  const categories = ['tse', 'otc']
  const categoryLowerCase = category.toLowerCase()

  if (!categories.includes(categoryLowerCase)) {
    displayFailed(`${category} not found chinese word.`)
  }

  return categoryLowerCase == 'tse' ? '上市' : '上櫃'
}

function getDecimalString(text: string | number, point = 2) {
  if (typeof text === 'number') {
    return text.toFixed(point).toString()
  }

  return parseFloat(text).toFixed(point).toString()
}

function convertToPercentage(text: string | number): string {
  return isNaN(Number(text)) ? '-' : getDecimalString(text)
}

function percentageHandle(num: string) {
  return `${parseFloat(num)}%`
}

export {
  category2Chinese,
  convertToPercentage,
  getDecimalString,
  getStockUpsAndDownsPercentage,
  percentageHandle,
}
