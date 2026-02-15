import { MAX_TERMINAL_WIDTH } from '@/constants'
import { StockOptionProps } from '@/types/stock'

import Field from './field'

const originalColumns = process.stdout.columns

afterEach(() => {
  Object.defineProperty(process.stdout, 'columns', {
    value: originalColumns,
    writable: true,
    configurable: true,
  })
})

function setTerminalWidth(width: number) {
  Object.defineProperty(process.stdout, 'columns', {
    value: width,
    writable: true,
    configurable: true,
  })
}

describe('Field.basic', () => {
  const baseOptions: StockOptionProps = { details: true, oddLot: false }

  it('returns short form when details is false', () => {
    setTerminalWidth(200)
    const fields = Field.basic({ ...baseOptions, details: false })
    expect(fields).toHaveLength(6)
    expect(fields[0].name).toBe('代號')
  })

  it('returns short form when terminal is narrow', () => {
    setTerminalWidth(MAX_TERMINAL_WIDTH - 1)
    const fields = Field.basic(baseOptions)
    expect(fields).toHaveLength(6)
  })

  it('returns detailed form when terminal is wide and details is true', () => {
    setTerminalWidth(MAX_TERMINAL_WIDTH + 1)
    const fields = Field.basic(baseOptions)
    expect(fields).toHaveLength(14)
    expect(fields.map((f) => f.name)).toContain('類別')
    expect(fields.map((f) => f.name)).toContain('昨收')
    expect(fields.map((f) => f.name)).toContain('漲停')
  })

  it('uses "s" code for volume when oddLot is true', () => {
    setTerminalWidth(200)
    const fields = Field.basic({ ...baseOptions, details: false, oddLot: true })
    const volumeField = fields.find((f) => f.name === '當盤成交量')
    expect(volumeField?.code).toBe('s')
  })

  it('uses "tv" code for volume when oddLot is false', () => {
    setTerminalWidth(200)
    const fields = Field.basic({
      ...baseOptions,
      details: false,
      oddLot: false,
    })
    const volumeField = fields.find((f) => f.name === '當盤成交量')
    expect(volumeField?.code).toBe('tv')
  })

  it('includes callback for 漲跌幅', () => {
    setTerminalWidth(200)
    const fields = Field.basic({ ...baseOptions, details: false })
    const percentField = fields.find((f) => f.name === '漲跌幅')
    expect(percentField?.callback).toBeTypeOf('function')
  })
})

describe('Field.stockIndex', () => {
  it('returns 9 fields', () => {
    expect(Field.stockIndex()).toHaveLength(9)
  })

  it('first field is 指數名稱', () => {
    expect(Field.stockIndex()[0].name).toBe('指數名稱')
  })
})

describe('Field.history', () => {
  it('returns 9 fields', () => {
    expect(Field.history()).toHaveLength(9)
  })

  it('has correct field names', () => {
    const names = Field.history().map((f) => f.name)
    expect(names).toEqual([
      '日期',
      '成交股數',
      '成交金額',
      '開盤價',
      '最高價',
      '最低價',
      '收盤價',
      '漲跌價差',
      '成交筆數',
    ])
  })

  it('has sequential string codes', () => {
    const codes = Field.history().map((f) => f.code)
    expect(codes).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8'])
  })
})
