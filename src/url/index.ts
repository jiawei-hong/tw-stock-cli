const STOCK_BASE_URL: string = 'https://mis.twse.com.tw/stock/'

function getStock(isOddLot: boolean): string {
  return `${STOCK_BASE_URL}/api/get${isOddLot ? 'Odd' : 'Stock'}Info.jsp?ex_ch=`
}

function generateOHLCURL(type: string): string {
  return `${STOCK_BASE_URL}/data/mis_ohlc_${type.toUpperCase()}.txt`
}

function getStockWithDate(
  code: string | undefined,
  date: string,
  category: string
) {
  if (category == 'otc') {
    return `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?d=${date}&stkno=${code}`
  }

  return `https://www.twse.com.tw/exchangeReport/STOCK_DAY?date=${date}&stockNo=${code}`
}

export { generateOHLCURL, getStock, getStockWithDate }
