import { Category } from '@/types/stock'

function getTseRankUrl(date: string): string {
  return `https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?date=${date}&type=ALLBUT0999&response=json`
}

function getOtcRankUrl(date: string): string {
  return `https://www.tpex.org.tw/web/stock/aftertrading/daily_close_quotes/stk_quote_result.php?l=zh-tw&o=json&d=${date}&s=0,asc,0`
}

function getRankUrl(date: string, category: Category): string {
  if (category === Category.OTC) {
    return getOtcRankUrl(date)
  }
  return getTseRankUrl(date)
}

export { getOtcRankUrl, getRankUrl, getTseRankUrl }
