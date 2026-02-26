import { Category } from '@/types/stock'
import { UrlBuilder } from '@/utils/url-builder'

function getSummaryUrl(date: string): string {
  return UrlBuilder.tse()
    .withPath('/rwd/zh/fund/BFI82U')
    .withDate(date)
    .withJsonResponse()
    .build()
}

function getStockUrl(date: string, category: Category): string {
  if (category === Category.OTC) {
    return UrlBuilder.otc()
      .withPath('/web/stock/3insti/daily_trade/3itrade_hedge_result.php')
      .withParam('l', 'zh-tw')
      .withJsonResponse()
      .withParam('se', 'AL')
      .withDate(date)
      .build()
  }

  return UrlBuilder.tse()
    .withPath('/rwd/zh/fund/T86')
    .withDate(date)
    .withParam('selectType', 'ALL')
    .withJsonResponse()
    .build()
}

export { getStockUrl, getSummaryUrl }
