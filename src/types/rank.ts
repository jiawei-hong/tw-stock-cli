import { Category } from './stock'

export type RankOptionProps = {
  listed?: Category
  date?: string
  number?: number
  losers?: boolean
  volume?: boolean
}

export type RankRow = {
  code: string
  name: string
  close: number
  change: number
  changePercent: number
  volume: number
}

export type RankTseTable = {
  title: string
  fields: string[]
  data: string[][]
}

export type RankTseResponse = {
  stat: string
  date: string
  title: string
  tables: RankTseTable[]
}

export type RankOtcTable = {
  title: string
  totalCount: number
  fields: string[]
  data: string[][]
}

export type RankOtcResponse = {
  date: string
  stat: string
  tables: RankOtcTable[]
}
