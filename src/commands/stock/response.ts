import { STOCK_NOT_FOUND } from '@/messages/stock'
import { StockResponse, TStock } from '@/types/stock'
import { displayFailed } from '@/utils/text'

export function extractStockData(
  data: StockResponse
): string | TStock[] | string[] {
  const dataField = ['data', 'aaData', 'msgArray']
  const getDataKey = Object.keys(data).find((key) => dataField.includes(key))

  if ('stat' in data && data['stat'] != 'OK') {
    return data['stat'] as string
  }

  if (!getDataKey) {
    displayFailed(STOCK_NOT_FOUND)
    return []
  }

  return data[getDataKey as keyof typeof data]
}
