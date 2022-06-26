import { getStockUpsAndDownsPercentage, category2Chinese } from '../lib/stock'

class Field {
  static basic(options) {
    return [
      { code: 'c', name: '代號', alignment: 'center' },
      {
        code: 'ex',
        name: '類別',
        alignment: 'center',
        callback: (stock) => category2Chinese(stock.ex),
      },
      { code: 'n', name: '公司', alignment: 'center' },
      { code: 'z', name: '當盤成交價', color: 'yellow' },
      { code: options.oddlot ? 's' : 'tv', name: '當盤成交量' },
      { code: 'v', name: '累積成交量' },
      { code: 'y', name: '昨收', color: 'cyan' },
      { code: 'o', name: '開盤' },
      { code: 'h', name: '最高' },
      { code: 'l', name: '最低' },
      { code: 'u', name: '漲停', color: 'red' },
      { code: 'w', name: '跌停', color: 'green' },
      { code: 't', name: '最近成交時刻', alignment: 'center' },
      {
        name: '漲跌幅',
        callback: getStockUpsAndDownsPercentage,
      },
    ]
  }

  static stockIndex() {
    return [
      { code: 'n', name: '指數名稱', alignment: 'center' },
      { code: 'z', name: '當盤指數', color: 'yellow' },
      { code: 'tv', name: '當盤成交量' },
      { code: 'v', name: '累積成交量' },
      { code: 'y', name: '昨收指數', color: 'cyan' },
      { code: 'o', name: '開盤' },
      { code: 'h', name: '最高', color: 'red' },
      { code: 'l', name: '最低', color: 'green' },
      { code: 't', name: '最近成交時刻', alignment: 'center' },
    ]
  }

  static history() {
    const historyFiedlName = [
      '日期',
      '成交股數',
      '成交金額',
      '開盤價',
      '最高價',
      '最低價',
      '收盤價',
      '漲跌價差',
      '成交筆數',
    ]

    return historyFiedlName.map((name, i) => {
      return {
        code: i,
        name,
      }
    })
  }
}

export default Field
