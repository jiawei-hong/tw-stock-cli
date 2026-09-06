import { getSecurityDirectory } from '@/services/security-directory'
import { Category } from '@/types/stock'

export const toUppercase = (value: string) => value?.toUpperCase()

export function getConversionDate(date: string, category = 'tse') {
  const normalized = date.replace(/-/g, '')
  const dateRegex = {
    day: /(\d{4})(\d{2})(\d{2})/g,
    month: /(\d{4})(\d{2})/g,
  }
  let data = Object.keys(dateRegex)
    .map((key) => [
      ...normalized.matchAll(dateRegex[key as keyof typeof dateRegex]),
    ])
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

async function transformStockToIncludeCategory({
  stocks,
  listed,
}: {
  stocks: string | string[]
  listed?: Category
}): Promise<string> {
  if (Array.isArray(stocks)) {
    const directory = await getSecurityDirectory()
    return stocks
      .map(toUppercase)
      .filter((code) => directory[code])
      .map((code) => `${directory[code].category}_${code}.tw`)
      .join('|')
  }

  return `${listed}_${toUppercase(stocks)}.tw`
}

export async function generateGetStockURL({
  stocks,
  listed,
}: {
  stocks: string | string[]
  listed?: Category
}): Promise<string> {
  return transformStockToIncludeCategory({
    stocks,
    listed,
  })
}
