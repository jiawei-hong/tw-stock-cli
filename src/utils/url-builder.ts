import { Category } from '@/types/stock'

const BASE_URLS = {
  [Category.TSE]: 'https://www.twse.com.tw',
  [Category.OTC]: 'https://www.tpex.org.tw',
} as const

export class UrlBuilder {
  private baseUrl: string = ''
  private path: string = ''
  private params: Map<string, string> = new Map()

  static tse(): UrlBuilder {
    const builder = new UrlBuilder()
    builder.baseUrl = BASE_URLS[Category.TSE]
    return builder
  }

  static otc(): UrlBuilder {
    const builder = new UrlBuilder()
    builder.baseUrl = BASE_URLS[Category.OTC]
    return builder
  }

  static fromCategory(category: Category): UrlBuilder {
    if (category === Category.OTC) return UrlBuilder.otc()
    return UrlBuilder.tse()
  }

  withPath(path: string): UrlBuilder {
    this.path = path
    return this
  }

  withParam(key: string, value: string): UrlBuilder {
    this.params.set(key, value)
    return this
  }

  withDate(date: string): UrlBuilder {
    if (this.baseUrl === BASE_URLS[Category.OTC]) {
      return this.withParam('d', date)
    }
    return this.withParam('date', date)
  }

  withJsonResponse(): UrlBuilder {
    if (this.baseUrl === BASE_URLS[Category.OTC]) {
      return this.withParam('o', 'json')
    }
    return this.withParam('response', 'json')
  }

  build(): string {
    const queryString = Array.from(this.params.entries())
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join('&')

    const base = `${this.baseUrl}${this.path}`
    return queryString ? `${base}?${queryString}` : base
  }
}
