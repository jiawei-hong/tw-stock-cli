export type TStock = {
  tv: string
  ps: string
  pz: string
  bp: string
  fv: string
  oa: string
  ob: string
  a: string
  b: string
  c: string
  d: string
  ch: string
  ot: string
  tlong: string
  f: string
  ip: string
  g: string
  mt: string
  ov: string
  h: string
  i: string
  it: string
  oz: string
  l: string
  n: string
  o: string
  p: string
  ex: Category
  s: string
  t: string
  u: string
  v: string
  w: string
  nf: string
  y: string
  z: string
  ts: string
}

export enum Category {
  TSE = 'tse',
  OTC = 'otc',
}

export type Stock = {
  cachedAlive: number
  exKey: string
  msgArray: TStock[]
  queryTime: QueryTime
  referer: string
  rtcode: string
  rtmessage: string
  userDelay: number
  stat: string
}

export type Histroy = {
  stat: string
  date: string
  title: string
  fields: string[]
  data: Array<string[]>[]
  notes: string[]
}

export type QueryTime = {
  sessionFromTime: number
  sessionLatestTime: number
  sessionStr: string
  showChart: boolean
  stockInfo: number
  stockInfoItem: number
  sysDate: string
  sysTime: string
}

export type StockResponse =
  | Stock
  | History
  | {
      stkNo: string
      stkName: string
      showListPriceNote: boolean
      showListPriceLink: boolean
      reportDate: string
      iTotalRecords: number
      aaData: Array<string[]>[]
    }

export type StockPayload = Record<
  string,
  {
    name: string
    category: string
  }
>

export type StockOptionProps = {
  listed?: Category
  multiple?: boolean
  favorite?: boolean
  oddLot?: boolean
  date?: string
  type?: string
}

export enum StockMode {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
  FAVORITE = 'FAVORITE',
  DATE = 'DATE',
}
