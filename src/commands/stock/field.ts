import { MAX_TERMINAL_WIDTH } from '@/constants'
import type { FieldProps } from '@/types/field'
import { StockOptionProps, TStock } from '@/types/stock'
import { category2Chinese, getStockUpsAndDownsPercentage } from '@/utils/stock'

const isTerminalWidthSmall = () => process.stdout.columns < MAX_TERMINAL_WIDTH

class Field {
  static basic(options: StockOptionProps): FieldProps[] {
    if (!options.details || isTerminalWidthSmall()) {
      return [
        { code: 'c', name: '代號' },
        { code: 'n', name: '公司' },
        { code: 'z', name: '當盤成交價' },
        { code: options.oddLot ? 's' : 'tv', name: '當盤成交量' },
        { code: 'v', name: '累積成交量' },
        {
          name: '漲跌幅',
          callback: (stock: TStock): string =>
            getStockUpsAndDownsPercentage(stock.y, stock.z),
        },
      ]
    }

    return [
      { code: 'c', name: '代號' },
      {
        code: 'ex',
        name: '類別',
        callback: (stock: TStock): string => category2Chinese(stock.ex),
      },
      { code: 'n', name: '公司' },
      { code: 'z', name: '當盤成交價' },
      { code: options.oddLot ? 's' : 'tv', name: '當盤成交量' },
      { code: 'v', name: '累積成交量' },
      { code: 'y', name: '昨收' },
      { code: 'o', name: '開盤' },
      { code: 'h', name: '最高' },
      { code: 'l', name: '最低' },
      { code: 'u', name: '漲停' },
      { code: 'w', name: '跌停' },
      { code: 't', name: '最近成交時刻' },
      {
        name: '漲跌幅',
        callback: (stock: TStock): string =>
          getStockUpsAndDownsPercentage(stock.y, stock.z),
      },
    ]
  }

  static stockIndex(): FieldProps[] {
    return [
      { code: 'n', name: '指數名稱' },
      { code: 'z', name: '當盤指數' },
      { code: 'tv', name: '當盤成交量' },
      { code: 'v', name: '累積成交量' },
      { code: 'y', name: '昨收指數' },
      { code: 'o', name: '開盤' },
      { code: 'h', name: '最高' },
      { code: 'l', name: '最低' },
      { code: 't', name: '最近成交時刻' },
    ]
  }

  static history(): FieldProps[] {
    const historyFieldName = [
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

    return historyFieldName.map((name, i) => {
      return {
        code: i.toString(),
        name,
      }
    })
  }
}

export default Field
