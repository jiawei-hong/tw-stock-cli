import {
  generateGetStockURL,
  getConversionDate,
  getTaiwanDateFormat,
  toUppercase,
} from '@/commands/stock/utils'
import { getSecurityDirectory } from '@/services/security-directory'
import { Category } from '@/types/stock'
import { getTableHeader } from '@/utils/table'

vi.mock('@/services/security-directory', () => ({
  getSecurityDirectory: vi.fn(),
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
  it('generates URL for single stock with listed category', async () => {
    await expect(
      generateGetStockURL({ stocks: '2330', listed: Category.TSE })
    ).resolves.toBe('tse_2330.tw')
    expect(getSecurityDirectory).not.toHaveBeenCalled()
  })

  it('generates URL for single OTC stock', async () => {
    await expect(
      generateGetStockURL({ stocks: '6547', listed: Category.OTC })
    ).resolves.toBe('otc_6547.tw')
  })

  it('queries both markets for a single stock without an override', async () => {
    await expect(generateGetStockURL({ stocks: '2330' })).resolves.toBe(
      'tse_2330.tw|otc_2330.tw'
    )
    expect(getSecurityDirectory).not.toHaveBeenCalled()
  })

  it('queries both markets for multiple stocks without TDCC', async () => {
    vi.mocked(getSecurityDirectory).mockResolvedValue({
      '2330': { name: 'TSMC', category: 'tse' },
      '00400A': { name: 'ETF', category: 'tse' },
    })

    await expect(
      generateGetStockURL({ stocks: ['2330', '00400a'] })
    ).resolves.toBe('tse_2330.tw|otc_2330.tw|tse_00400A.tw|otc_00400A.tw')
    expect(getSecurityDirectory).not.toHaveBeenCalled()
  })

  it('lets MIS resolve unknown codes', async () => {
    vi.mocked(getSecurityDirectory).mockResolvedValue({
      '2330': { name: 'TSMC', category: 'tse' },
    })

    await expect(
      generateGetStockURL({ stocks: ['2330', '9999'] })
    ).resolves.toBe('tse_2330.tw|otc_2330.tw|tse_9999.tw|otc_9999.tw')
  })
  it('returns an empty query without fetching a directory', async () => {
    await expect(generateGetStockURL({ stocks: [] })).resolves.toBe('')
    expect(getSecurityDirectory).not.toHaveBeenCalled()
  })
})
