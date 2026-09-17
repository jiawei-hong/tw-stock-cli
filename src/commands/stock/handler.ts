import { StockOptionProps } from '@/types/stock'

import StockChart from './chart-handler'
import HistoryStock from './history-handler'
import RealtimeStock from './realtime-handler'
import SearchStock from './search-handler'

class Stock {
  private handler: RealtimeStock | HistoryStock | SearchStock | StockChart

  constructor(code: string | undefined, options: StockOptionProps) {
    if (options.range !== undefined && !options.chart)
      throw new Error('--range requires --chart')
    if (options.chart) {
      if (
        options.watch !== undefined ||
        options.search !== undefined ||
        options.multiple ||
        options.favorite ||
        options.oddLot
      ) {
        throw new Error(
          '--chart requires a single stock; remove --watch, --search, --multiple, --favorite, and --odd-lot'
        )
      }
      if (options.date && options.range !== undefined)
        throw new Error('Use either --date YYYY-MM or --range with --chart')
      this.handler = new StockChart(code, options)
      return
    }
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
