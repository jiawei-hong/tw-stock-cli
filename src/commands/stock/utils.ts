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
  const codes = Array.isArray(stocks) ? stocks : [stocks]
  const invalid = codes.filter(
    (code) => typeof code !== 'string' || !/^[A-Za-z0-9]{1,16}$/.test(code)
  )
  if (invalid.length) {
    throw new Error(
      `Invalid stock codes: ${invalid
        .map((code) => (typeof code === 'string' && code ? code : '(empty)'))
        .join(', ')}. Use --search <code-or-name> to find a stock by name.`
    )
  }
  if (listed && ![Category.TSE, Category.OTC].includes(listed))
    throw new Error(`Invalid market: ${listed}`)
  if (Array.isArray(stocks)) {
    return [...new Set(stocks.map(toUppercase).filter(Boolean))]
      .flatMap((code) => [`tse_${code}.tw`, `otc_${code}.tw`])
      .join('|')
  }

  const code = toUppercase(stocks)
  if (!listed) return `tse_${code}.tw|otc_${code}.tw`

  return `${listed}_${code}.tw`
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
