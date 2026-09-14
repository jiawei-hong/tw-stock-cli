import { extractStockData } from '@/commands/stock/response'
import { StockResponse } from '@/types/stock'

describe('MIS symbol resolution', () => {
  it('removes unmatched market placeholders but keeps unavailable prices', () => {
    const quote = { c: '1101', ex: 'tse', z: '-' }
    const response = {
      msgArray: [{ c: '', z: '-' }, quote],
    } as StockResponse
    expect(extractStockData(response)).toEqual([quote])
  })

  it('returns no stocks when neither market matches', () => {
    expect(
      extractStockData({ msgArray: [{ c: '', z: '-' }] } as StockResponse)
    ).toEqual([])
  })
})
