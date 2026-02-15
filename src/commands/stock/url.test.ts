import { generateOHLCURL, getStock, getStockWithDate } from './url'

describe('getStock', () => {
  it('returns regular stock URL when isOddLot is false', () => {
    expect(getStock(false)).toBe(
      'https://mis.twse.com.tw/stock//api/getStockInfo.jsp?ex_ch='
    )
  })

  it('returns odd-lot URL when isOddLot is true', () => {
    expect(getStock(true)).toBe(
      'https://mis.twse.com.tw/stock//api/getOddInfo.jsp?ex_ch='
    )
  })
})

describe('generateOHLCURL', () => {
  it('generates TSE OHLC URL', () => {
    expect(generateOHLCURL('tse')).toBe(
      'https://mis.twse.com.tw/stock//data/mis_ohlc_TSE.txt'
    )
  })

  it('generates OTC OHLC URL', () => {
    expect(generateOHLCURL('otc')).toBe(
      'https://mis.twse.com.tw/stock//data/mis_ohlc_OTC.txt'
    )
  })

  it('uppercases the type', () => {
    expect(generateOHLCURL('frmsa')).toBe(
      'https://mis.twse.com.tw/stock//data/mis_ohlc_FRMSA.txt'
    )
  })
})

describe('getStockWithDate', () => {
  it('returns TWSE URL for tse category', () => {
    expect(getStockWithDate('2330', '20220601', 'tse')).toBe(
      'https://www.twse.com.tw/exchangeReport/STOCK_DAY?date=20220601&stockNo=2330'
    )
  })

  it('returns TPEX URL for otc category', () => {
    expect(getStockWithDate('6547', '111/06/01', 'otc')).toBe(
      'https://www.tpex.org.tw/web/stock/aftertrading/daily_trading_info/st43_result.php?d=111/06/01&stkno=6547'
    )
  })

  it('defaults to TWSE URL for non-otc category', () => {
    expect(getStockWithDate('2330', '20220601', 'any')).toBe(
      'https://www.twse.com.tw/exchangeReport/STOCK_DAY?date=20220601&stockNo=2330'
    )
  })
})
