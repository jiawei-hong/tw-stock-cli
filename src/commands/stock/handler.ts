import { StockOptionProps } from '@/types/stock'

import HistoryStock from './history-handler'
import RealtimeStock from './realtime-handler'

class Stock {
  private handler: RealtimeStock | HistoryStock

  constructor(code: string, options: StockOptionProps) {
    if (options.date) {
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
