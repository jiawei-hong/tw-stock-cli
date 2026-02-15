import { Category } from '@/types/stock'
import FilePath from '@/utils/file'

import type { FieldProps } from './field'

export const toUppercase = (value: string) => value?.toUpperCase()

export const getTableHeader = (headerField: FieldProps[]): string[] =>
  headerField.map((field) => field.name)

export function getConversionDate(date: string, category = 'tse') {
  const dateRegex = {
    day: /(\d{4})(\d{2})(\d{2})/g,
    month: /(\d{4})(\d{2})/g,
  }
  let data = Object.keys(dateRegex)
    .map((key) => [...date.matchAll(dateRegex[key as keyof typeof dateRegex])])
    .find((d) => d.length > 0)

  if (data && category == 'otc') {
    data[0][1] = (parseInt(data[0][1]) - 1911).toString()
  }

  return !data ? 'Invalid Date' : data[0].splice(1, data[0].length - 1)
}

export function getTaiwanDateFormat(date: string[], separator = '/') {
  date[0] = (parseInt(date[0]) - 1911).toString()
  return date.join(separator)
}

function getStockCategory(code: string): Category {
  const stocks = FilePath.stock.read()
  return stocks?.[code]?.category
}

function combineStockAndCategory(code: string) {
  const category = getStockCategory(code)
  return `${category}_${toUppercase(code)}.tw`
}

function transformStockToIncludeCategory({
  stocks,
  listed,
}: {
  stocks: string | string[]
  listed?: Category
}): string {
  if (Array.isArray(stocks)) {
    return stocks
      .filter((code) => getStockCategory(code))
      .map((code) => combineStockAndCategory(code))
      .join('|')
  }

  return `${listed}_${toUppercase(stocks)}.tw`
}

export function generateGetStockURL({
  stocks,
  listed,
}: {
  stocks: string | string[]
  listed?: Category
}): string {
  return transformStockToIncludeCategory({
    stocks,
    listed,
  })
}
