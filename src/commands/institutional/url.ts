import { Category } from '@/types/stock'

function getSummaryUrl(date: string): string {
  return `https://www.twse.com.tw/rwd/zh/fund/BFI82U?date=${date}&response=json`
}

function getTseStockUrl(date: string): string {
  return `https://www.twse.com.tw/rwd/zh/fund/T86?date=${date}&selectType=ALL&response=json`
}

function getOtcStockUrl(date: string): string {
  return `https://www.tpex.org.tw/web/stock/3insti/daily_trade/3itrade_hedge_result.php?l=zh-tw&o=json&se=AL&d=${date}`
}

function getStockUrl(date: string, category: Category): string {
  if (category === Category.OTC) {
    return getOtcStockUrl(date)
  }
  return getTseStockUrl(date)
}

export { getOtcStockUrl, getStockUrl, getSummaryUrl, getTseStockUrl }
