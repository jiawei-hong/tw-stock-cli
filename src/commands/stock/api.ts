import { StockResponse } from '@/types/stock'
import { displayFailed } from '@/utils/text'

function getStock(url: string): Promise<StockResponse> {
  return fetch(url)
    .then((res) => res.json())
    .catch((err) => displayFailed(err))
}

export { getStock }
