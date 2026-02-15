import { displayFailed, getDisplayActionText, Status } from './text'

export function getStockUpsAndDownsPercentage(
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
    parseFloat(dec) > 0 ? Status.failed : Status.success
  )
}

export function category2Chinese(category: 'tse' | 'otc') {
  const categories = ['tse', 'otc']
  const categoryLowerCase = category.toLowerCase()

  if (!categories.includes(categoryLowerCase)) {
    displayFailed(`${category} not found chinese word.`)
  }

  return categoryLowerCase == 'tse' ? '上市' : '上櫃'
}

export function getDecimalString(text: string | number, point = 2) {
  if (typeof text === 'number') {
    return text.toFixed(point).toString()
  }

  return parseFloat(text).toFixed(point).toString()
}

export function shouldConvertToPercentage(text: string): boolean {
  return text?.includes('.')
}

export function convertToPercentage(text: string | number): string {
  return isNaN(Number(text)) ? '-' : getDecimalString(text)
}

export function percentageHandle(num: string) {
  return `${parseFloat(num)}%`
}
