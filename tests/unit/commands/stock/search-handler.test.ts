import {
  formatSearchResults,
  getSearchNotFoundMessage,
} from '@/commands/stock/search-handler'
import { Category } from '@/types/stock'

describe('formatSearchResults', () => {
  it('formats stable discovery columns', () => {
    expect(
      formatSearchResults([
        {
          code: '2330',
          name: 'TSMC',
          category: Category.TSE,
          status: 'active',
        },
      ])
    ).toEqual([
      ['股票代號', '公司名稱', '市場'],
      ['2330', 'TSMC', '上市 (TSE)'],
    ])
  })
})

describe('getSearchNotFoundMessage', () => {
  it('includes the query and market filter', () => {
    expect(getSearchNotFoundMessage('2330', Category.OTC)).toContain(
      'No active stocks matched "2330" in OTC'
    )
  })
})
