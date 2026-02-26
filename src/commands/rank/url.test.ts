import { Category } from '@/types/stock'

import { getRankUrl } from './url'

describe('getRankUrl', () => {
  it('builds TSE rank URL', () => {
    const url = getRankUrl('20240315', Category.TSE)
    expect(url).toContain('https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX')
    expect(url).toContain('date=20240315')
    expect(url).toContain('type=ALLBUT0999')
    expect(url).toContain('response=json')
  })

  it('builds OTC rank URL', () => {
    const url = getRankUrl('113/03/15', Category.OTC)
    expect(url).toContain('https://www.tpex.org.tw')
    expect(url).toContain('stk_quote_result.php')
    expect(url).toContain('l=zh-tw')
    expect(url).toContain('o=json')
  })
})
