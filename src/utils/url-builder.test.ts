import { Category } from '@/types/stock'

import { UrlBuilder } from './url-builder'

describe('UrlBuilder static factories', () => {
  it('tse() sets base URL to twse.com.tw', () => {
    const url = UrlBuilder.tse().build()
    expect(url).toBe('https://www.twse.com.tw')
  })

  it('otc() sets base URL to tpex.org.tw', () => {
    const url = UrlBuilder.otc().build()
    expect(url).toBe('https://www.tpex.org.tw')
  })

  it('fromCategory(TSE) returns TSE builder', () => {
    const url = UrlBuilder.fromCategory(Category.TSE).build()
    expect(url).toBe('https://www.twse.com.tw')
  })

  it('fromCategory(OTC) returns OTC builder', () => {
    const url = UrlBuilder.fromCategory(Category.OTC).build()
    expect(url).toBe('https://www.tpex.org.tw')
  })
})

describe('UrlBuilder fluent methods', () => {
  it('withPath appends path to base URL', () => {
    const url = UrlBuilder.tse().withPath('/rwd/zh/fund/BFI82U').build()
    expect(url).toBe('https://www.twse.com.tw/rwd/zh/fund/BFI82U')
  })

  it('withParam adds a query parameter', () => {
    const url = UrlBuilder.tse().withParam('type', 'ALL').build()
    expect(url).toBe('https://www.twse.com.tw?type=ALL')
  })

  it('withParam supports multiple parameters', () => {
    const url = UrlBuilder.tse()
      .withParam('a', '1')
      .withParam('b', '2')
      .build()
    expect(url).toBe('https://www.twse.com.tw?a=1&b=2')
  })

  it('withDate uses "date" param for TSE', () => {
    const url = UrlBuilder.tse().withDate('20240315').build()
    expect(url).toBe('https://www.twse.com.tw?date=20240315')
  })

  it('withDate uses "d" param for OTC', () => {
    const url = UrlBuilder.otc().withDate('113/03/15').build()
    expect(url).toBe('https://www.tpex.org.tw?d=113%2F03%2F15')
  })

  it('withJsonResponse uses "response" param for TSE', () => {
    const url = UrlBuilder.tse().withJsonResponse().build()
    expect(url).toBe('https://www.twse.com.tw?response=json')
  })

  it('withJsonResponse uses "o" param for OTC', () => {
    const url = UrlBuilder.otc().withJsonResponse().build()
    expect(url).toBe('https://www.tpex.org.tw?o=json')
  })
})

describe('UrlBuilder.build()', () => {
  it('returns base URL when no path or params', () => {
    expect(UrlBuilder.tse().build()).toBe('https://www.twse.com.tw')
  })

  it('combines path and params correctly', () => {
    const url = UrlBuilder.tse()
      .withPath('/api/data')
      .withParam('key', 'value')
      .build()
    expect(url).toBe('https://www.twse.com.tw/api/data?key=value')
  })

  it('encodes special characters in param values', () => {
    const url = UrlBuilder.tse().withParam('q', 'a b').build()
    expect(url).toBe('https://www.twse.com.tw?q=a%20b')
  })
})
