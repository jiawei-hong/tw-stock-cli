class StockURL {
  static getStockAPI(isOddlot) {
    return `https://mis.twse.com.tw/stock/api/get${
      isOddlot ? 'Odd' : 'Stock'
    }Info.jsp?ex_ch=`
  }

  static getConversionDate(date, category = 'tse') {
    const dateRegex = {
      day: /(\d{4})(\d{2})(\d{2})/g,
      month: /(\d{4})(\d{2})/g,
    }
    let data = Object.keys(dateRegex)
      .map((key) => [...date.matchAll(dateRegex[key])])
      .find((d) => d.length > 0)

    if (category == 'otc') {
      data[0][1] -= 1911
    }

    return !data ? 'Invalid Date' : data[0].splice(1, data[0].length - 1)
  }

  static getStockAPIWithDate(code, date, category = 'tse') {
    if (category == 'otc') {
      return `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?d=${date}&stkno=${code}`
    }

    return `https://www.twse.com.tw/exchangeReport/STOCK_DAY?date=${date}&stockNo=${code}`
  }
}

module.exports = StockURL
