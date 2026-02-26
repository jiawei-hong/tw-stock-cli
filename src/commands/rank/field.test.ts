import Field from './field'

describe('Field.ranking', () => {
  it('returns 7 fields', () => {
    expect(Field.ranking()).toHaveLength(7)
  })

  it('has correct field names', () => {
    const names = Field.ranking().map((f) => f.name)
    expect(names).toEqual([
      '排名',
      '代號',
      '名稱',
      '收盤價',
      '漲跌',
      '漲跌幅(%)',
      '成交量',
    ])
  })

  it('returns new array instances on each call', () => {
    expect(Field.ranking()).not.toBe(Field.ranking())
  })
})
