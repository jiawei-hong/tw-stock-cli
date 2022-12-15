import axios from 'axios'

import { displayFailed } from '../lib/Text'
import { StockResponse } from '../types/stock'

function getStock(url: string): Promise<StockResponse> {
  return axios
    .get(url)
    .then((res) => res.data)
    .catch((err) => displayFailed(err))
}

export { getStock }
