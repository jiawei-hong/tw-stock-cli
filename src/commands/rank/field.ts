export type FieldProps = {
  name: string
}

class Field {
  static ranking(): FieldProps[] {
    return [
      { name: '排名' },
      { name: '代號' },
      { name: '名稱' },
      { name: '收盤價' },
      { name: '漲跌' },
      { name: '漲跌幅(%)' },
      { name: '成交量' },
    ]
  }
}

export default Field
