import { StockOptionProps } from '@/types/stock'

import HistoryStock from './history-handler'
import RealtimeStock from './realtime-handler'
import SearchStock from './search-handler'

class Stock {
  private handler: RealtimeStock | HistoryStock | SearchStock

  constructor(code: string | undefined, options: StockOptionProps) {
    if (
      options.watch !== undefined &&
      (options.date || options.search !== undefined)
    ) {
      throw new Error(
        '--watch only supports realtime quotes; remove --date or --search'
      )
    }
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
