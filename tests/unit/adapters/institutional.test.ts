import { adaptInstitutionalResponse } from '@/adapters/institutional'
import { Category } from '@/types/stock'

// Real rows for 2026-11-13 from TWSE T86 and TPEx 3itrade_hedge_result.
const twse2330 = [
  '2330',
  '台積電          ',
  '19,372,551', // 外陸資買進(不含外資自營商)
  '21,990,621', // 外陸資賣出
  '-2,618,070', // 外陸資買賣超
  '0', // 外資自營商買進
  '0', // 外資自營商賣出
  '0', // 外資自營商買賣超
  '2,947,069', // 投信買進
  '1,000', // 投信賣出
  '2,946,069', // 投信買賣超
  '415,614', // 自營商買賣超
  '262,050',
  '96,710',
  '165,340', // 自營商(自行買賣)
  '446,588',
  '196,314',
  '250,274', // 自營商(避險)
  '743,613', // 三大法人買賣超
]
const tpex6488 = [
  '6488',
  '環球晶',
  '2,998,337',
  '2,958,139',
  '40,198', // 外資(不含自營)
  '0',
  '0',
  '0', // 外資自營商
  '2,998,337',
  '2,958,139',
  '40,198', // 外資合計
  '72,547',
  '149,000',
  '-76,453', // 投信
  '106,800',
  '52,100',
  '54,700', // 自營商(自行買賣)
  '179,911',
  '125,271',
  '54,640', // 自營商(避險)
  '286,711',
  '177,371',
  '109,340', // 自營商合計
  '73,085', // 三大法人合計
]

describe('adaptInstitutionalResponse', () => {
  describe('TSE response', () => {
    it('returns null when data is null', () => {
      expect(adaptInstitutionalResponse(null as any, Category.TSE)).toBeNull()
    })

    it('returns null when stat is not OK', () => {
      const data = { stat: '很抱歉，沒有符合條件的資料!', data: [twse2330] }
      expect(adaptInstitutionalResponse(data as any, Category.TSE)).toBeNull()
    })

    it('returns null when data array is empty', () => {
      const data = { stat: 'OK', data: [] }
      expect(adaptInstitutionalResponse(data as any, Category.TSE)).toBeNull()
    })

    it('returns null when data array is missing', () => {
      const data = { stat: 'OK' }
      expect(adaptInstitutionalResponse(data as any, Category.TSE)).toBeNull()
    })

    it('maps the T86 layout so the groups add up to the total', () => {
      const data = { stat: 'OK', data: [twse2330] }
      const [row] = adaptInstitutionalResponse(data as any, Category.TSE)!

      expect(row).toEqual({
        code: '2330',
        name: '台積電',
        foreignBuy: 19_372_551,
        foreignSell: 21_990_621,
        foreignNet: -2_618_070,
        trustBuy: 2_947_069,
        trustSell: 1_000,
        trustNet: 2_946_069,
        dealerNet: 415_614,
        totalNet: 743_613,
      })
      expect(row.foreignNet + row.trustNet + row.dealerNet).toBe(row.totalNet)
    })

    it('includes foreign dealers in the foreign figures', () => {
      const row = [...twse2330]
      row[5] = '100'
      row[6] = '40'
      row[7] = '60'
      const [result] = adaptInstitutionalResponse(
        { stat: 'OK', data: [row] } as any,
        Category.TSE
      )!
      expect(result).toMatchObject({
        foreignBuy: 19_372_651,
        foreignSell: 21_990_661,
        foreignNet: -2_618_010,
      })
    })

    it('rejects rows from an unexpected layout instead of misreading them', () => {
      const data = { stat: 'OK', data: [twse2330.slice(0, 12)] }
      expect(() =>
        adaptInstitutionalResponse(data as any, Category.TSE)
      ).toThrow(
        'Unexpected TSE institutional row layout: expected at least 19 columns, got 12'
      )
    })
  })

  describe('OTC response', () => {
    it('returns null when data is null', () => {
      expect(adaptInstitutionalResponse(null as any, Category.OTC)).toBeNull()
    })

    it('returns null on a non-trading day (empty table)', () => {
      const data = { stat: 'ok', tables: [{ data: [] }] }
      expect(adaptInstitutionalResponse(data as any, Category.OTC)).toBeNull()
    })

    it('returns null when no rows are present', () => {
      expect(adaptInstitutionalResponse({} as any, Category.OTC)).toBeNull()
    })

    it('maps the current tables layout so the groups add up to the total', () => {
      const data = { stat: 'ok', tables: [{ data: [tpex6488] }] }
      const [row] = adaptInstitutionalResponse(data as any, Category.OTC)!

      expect(row).toEqual({
        code: '6488',
        name: '環球晶',
        foreignBuy: 2_998_337,
        foreignSell: 2_958_139,
        foreignNet: 40_198,
        trustBuy: 72_547,
        trustSell: 149_000,
        trustNet: -76_453,
        dealerNet: 109_340,
        totalNet: 73_085,
      })
      expect(row.foreignNet + row.trustNet + row.dealerNet).toBe(row.totalNet)
    })

    it('still reads the legacy aaData format', () => {
      const [row] = adaptInstitutionalResponse(
        { aaData: [tpex6488] } as any,
        Category.OTC
      )!
      expect(row.totalNet).toBe(73_085)
    })
  })
})
