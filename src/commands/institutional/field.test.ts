import Field from './field'

describe('Field.summary', () => {
  it('returns 4 fields', () => {
    expect(Field.summary()).toHaveLength(4)
  })

  it('has correct field names', () => {
    const names = Field.summary().map((f) => f.name)
    expect(names).toEqual(['法人類別', '買進金額', '賣出金額', '買賣差額'])
  })
})

describe('Field.stock', () => {
  it('returns 6 fields', () => {
    expect(Field.stock()).toHaveLength(6)
  })

  it('has correct field names', () => {
    const names = Field.stock().map((f) => f.name)
    expect(names).toEqual([
      '代號',
      '名稱',
      '外資買賣超',
      '投信買賣超',
      '自營商買賣超',
      '三大法人買賣超',
    ])
  })

  it('returns new array instances on each call', () => {
    expect(Field.stock()).not.toBe(Field.stock())
  })
})
