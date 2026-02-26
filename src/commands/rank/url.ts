import { Category } from '@/types/stock'
import { UrlBuilder } from '@/utils/url-builder'

function getRankUrl(date: string, category: Category): string {
  if (category === Category.OTC) {
    return UrlBuilder.otc()
      .withPath(
        '/web/stock/aftertrading/daily_close_quotes/stk_quote_result.php'
      )
      .withParam('l', 'zh-tw')
      .withJsonResponse()
      .withDate(date)
      .withParam('s', '0,asc,0')
      .build()
  }

  return UrlBuilder.tse()
    .withPath('/rwd/zh/afterTrading/MI_INDEX')
    .withDate(date)
    .withParam('type', 'ALLBUT0999')
    .withJsonResponse()
    .build()
}

export { getRankUrl }
