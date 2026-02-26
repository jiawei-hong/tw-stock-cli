import { StockResponse, TStock } from '@/types/stock'

export function extractStockData(
  data: StockResponse
): string | TStock[] | null {
  const dataField = ['data', 'aaData', 'msgArray']
  const getDataKey = Object.keys(data).find((key) => dataField.includes(key))

  if ('stat' in data && data['stat'] !== 'OK') {
    return data['stat'] as string
  }

  if (!getDataKey) {
    return null
  }

  return data[getDataKey as keyof typeof data]
}
