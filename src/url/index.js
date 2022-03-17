class StockURL {
  static getStockAPI(isOddlot) {
    return `https://mis.twse.com.tw/stock/api/get${
      isOddlot ? 'Odd' : 'Stock'
    }Info.jsp?ex_ch=`
  }
}

module.exports = StockURL
