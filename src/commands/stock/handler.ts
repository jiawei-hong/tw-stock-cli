import { StockOptionProps } from '@/types/stock'

import HistoryStock from './history-handler'
import RealtimeStock from './realtime-handler'
import SearchStock from './search-handler'

class Stock {
  private handler: RealtimeStock | HistoryStock | SearchStock

  constructor(code: string | undefined, options: StockOptionProps) {
    if (options.search !== undefined) {
      this.handler = new SearchStock(options.search, options)
    } else if (options.date) {
      this.handler = new HistoryStock(code, options)
    } else {
      this.handler = new RealtimeStock(code, options)
    }
  }

  initialize() {
    return this.handler.initialize()
  }
}

export default Stock
