import { Category } from '@/types/stock'

import { getStockUrl, getSummaryUrl } from './url'

describe('getSummaryUrl', () => {
  it('builds a TSE summary URL with date and json response', () => {
    const url = getSummaryUrl('20240315')
    expect(url).toContain('https://www.twse.com.tw/rwd/zh/fund/BFI82U')
    expect(url).toContain('date=20240315')
    expect(url).toContain('response=json')
  })

  it('builds URL with empty date', () => {
    const url = getSummaryUrl('')
    expect(url).toContain('date=')
    expect(url).toContain('response=json')
  })
})

describe('getStockUrl', () => {
  it('builds TSE stock URL', () => {
    const url = getStockUrl('20240315', Category.TSE)
    expect(url).toContain('https://www.twse.com.tw/rwd/zh/fund/T86')
    expect(url).toContain('date=20240315')
    expect(url).toContain('selectType=ALL')
    expect(url).toContain('response=json')
  })

  it('builds OTC stock URL', () => {
    const url = getStockUrl('113/03/15', Category.OTC)
    expect(url).toContain('https://www.tpex.org.tw')
    expect(url).toContain('3itrade_hedge_result.php')
    expect(url).toContain('l=zh-tw')
    expect(url).toContain('o=json')
    expect(url).toContain('se=AL')
  })
})
