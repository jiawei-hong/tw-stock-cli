class StockURL {
  static prefix() {
    return 'https://mis.twse.com.tw/stock/'
  }

  static getStockAPI(isOddLot) {
    return `${this.prefix()}/api/get${
      isOddLot ? 'Odd' : 'Stock'
    }Info.jsp?ex_ch=`
  }

  static getOhlc(market = 'TSE') {
    return `${this.prefix()}/data/mis_ohlc_${market.toUpperCase()}.txt`
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

  static getTaiwanDateFormat(date, separator = '/') {
    date[0] -= 1911

    return date.join(separator)
  }

  static getStockAPIWithDate(code, date, category = 'tse') {
    if (category == 'otc') {
      return `https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?d=${date}&stkno=${code}`
    }

    return `https://www.twse.com.tw/exchangeReport/STOCK_DAY?date=${date}&stockNo=${code}`
  }
}

export default StockURL
