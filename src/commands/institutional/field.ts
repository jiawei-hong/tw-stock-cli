export type FieldProps = {
  name: string
}

class Field {
  static summary(): FieldProps[] {
    return [
      { name: '法人類別' },
      { name: '買進金額' },
      { name: '賣出金額' },
      { name: '買賣差額' },
    ]
  }

  static stock(): FieldProps[] {
    return [
      { name: '代號' },
      { name: '名稱' },
      { name: '外資買賣超' },
      { name: '投信買賣超' },
      { name: '自營商買賣超' },
      { name: '三大法人買賣超' },
    ]
  }
}

export default Field
