import { displayFailed } from '@/lib/text'
import { StockResponse } from '@/types/stock'

function getStock(url: string): Promise<StockResponse> {
  return fetch(url)
    .then((res) => res.json())
    .catch((err) => displayFailed(err))
}

export { getStock }
