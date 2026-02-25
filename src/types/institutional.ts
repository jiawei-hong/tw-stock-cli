import { Category } from './stock'

export type InstitutionalOptionProps = {
  listed?: Category
  date?: string
  number?: number
}

export type InstitutionalSummaryResponse = {
  stat: string
  date: string
  title: string
  fields: string[]
  data: string[][]
}

export type InstitutionalStockRow = {
  code: string
  name: string
  foreignBuy: number
  foreignSell: number
  foreignNet: number
  trustBuy: number
  trustSell: number
  trustNet: number
  dealerNet: number
  totalNet: number
}

export type InstitutionalTseResponse = {
  stat: string
  date: string
  title: string
  fields: string[]
  data: string[][]
}

export type InstitutionalOtcRow = string[]

export type InstitutionalOtcResponse = {
  reportDate: string
  reportTitle: string
  totalCount: number
  aaData: string[][]
}
