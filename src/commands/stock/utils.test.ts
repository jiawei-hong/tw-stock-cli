import { Category } from '@/types/stock'
import FilePath from '@/utils/file'

import {
  generateGetStockURL,
  getConversionDate,
  getTableHeader,
  getTaiwanDateFormat,
  toUppercase,
} from './utils'

vi.mock('@/utils/file', () => ({
  default: {
    stock: {
      read: vi.fn(),
      write: vi.fn(),
      exist: vi.fn(),
    },
    favorite: {
      read: vi.fn(),
      write: vi.fn(),
      exist: vi.fn(),
    },
  },
}))

describe('toUppercase', () => {
  it('converts to uppercase', () => {
    expect(toUppercase('abc')).toBe('ABC')
  })

  it('keeps already uppercase', () => {
    expect(toUppercase('ABC')).toBe('ABC')
  })

  it('handles mixed case', () => {
    expect(toUppercase('aBc')).toBe('ABC')
  })
})

describe('getTableHeader', () => {
  it('extracts names from field objects', () => {
    const fields = [{ name: '代號' }, { name: '漲跌幅' }]
    expect(getTableHeader(fields)).toEqual(['代號', '漲跌幅'])
  })

  it('returns empty array for empty input', () => {
    expect(getTableHeader([])).toEqual([])
  })
})

describe('getConversionDate', () => {
  it('parses YYYYMMDD format for tse', () => {
    expect(getConversionDate('20220601', 'tse')).toEqual(['2022', '06', '01'])
  })

  it('parses YYYYMM format for tse', () => {
    expect(getConversionDate('202206', 'tse')).toEqual(['2022', '06'])
  })

  it('parses YYYYMMDD format for otc with ROC year', () => {
    expect(getConversionDate('20220601', 'otc')).toEqual(['111', '06', '01'])
  })

  it('parses YYYYMM format for otc with ROC year', () => {
    expect(getConversionDate('202206', 'otc')).toEqual(['111', '06'])
  })

  it('returns "Invalid Date" for malformed input', () => {
    expect(getConversionDate('abc')).toBe('Invalid Date')
  })

  it('defaults to tse category', () => {
    expect(getConversionDate('20220601')).toEqual(['2022', '06', '01'])
  })

  it('parses YYYY-MM-DD format with hyphens', () => {
    expect(getConversionDate('2025-01-15', 'tse')).toEqual(['2025', '01', '15'])
  })

  it('parses YYYY-MM format with hyphens', () => {
    expect(getConversionDate('2025-01', 'tse')).toEqual(['2025', '01'])
  })

  it('parses YYYY-MM-DD format with hyphens for otc', () => {
    expect(getConversionDate('2025-01-15', 'otc')).toEqual(['114', '01', '15'])
  })
})

describe('getTaiwanDateFormat', () => {
  it('converts to ROC year with default separator', () => {
    expect(getTaiwanDateFormat(['2022', '06', '01'])).toBe('111/06/01')
  })

  it('uses custom separator', () => {
    expect(getTaiwanDateFormat(['2022', '06'], '-')).toBe('111-06')
  })
})

describe('generateGetStockURL', () => {
  it('generates URL for single stock with listed category', () => {
    expect(generateGetStockURL({ stocks: '2330', listed: Category.TSE })).toBe(
      'tse_2330.tw'
    )
  })

  it('generates URL for single OTC stock', () => {
    expect(generateGetStockURL({ stocks: '6547', listed: Category.OTC })).toBe(
      'otc_6547.tw'
    )
  })

  it('generates URL for multiple stocks from stock file', () => {
    vi.mocked(FilePath.stock.read).mockReturnValue({
      '2330': { name: 'TSMC', category: 'tse' },
      '2317': { name: 'Foxconn', category: 'tse' },
    })

    expect(generateGetStockURL({ stocks: ['2330', '2317'] })).toBe(
      'tse_2330.tw|tse_2317.tw'
    )
  })

  it('filters out codes not found in stock file', () => {
    vi.mocked(FilePath.stock.read).mockReturnValue({
      '2330': { name: 'TSMC', category: 'tse' },
    })

    expect(generateGetStockURL({ stocks: ['2330', '9999'] })).toBe(
      'tse_2330.tw'
    )
  })
})
