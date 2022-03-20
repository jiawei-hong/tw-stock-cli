class StockURL {
  static getStockAPI(isOddlot) {
    return `https://mis.twse.com.tw/stock/api/get${
      isOddlot ? 'Odd' : 'Stock'
    }Info.jsp?ex_ch=`
  }

  static getStockAPIWithDate(code, date, category = 'tse') {
    if (category == 'otc') {
      return `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?d=${date}&stkno=${code}`
    }

    return `https://www.twse.com.tw/exchangeReport/STOCK_DAY?date=${date}&stockNo=${code}`
  }
}

module.exports = StockURL
