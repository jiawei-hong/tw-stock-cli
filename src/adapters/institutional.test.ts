import { Category } from '@/types/stock'

import { adaptInstitutionalResponse } from './institutional'

describe('adaptInstitutionalResponse', () => {
  const makeRow = (code: string, name: string): string[] => [
    code,
    name,
    '1,000', // foreignBuy
    '500', // foreignSell
    '500', // foreignNet
    '200', // trustBuy
    '100', // trustSell
    '100', // trustNet
    '50', // dealerNet
    'x', // row[9]
    'x', // row[10]
    '650', // totalNet
  ]

  describe('TSE response', () => {
    it('returns null when data is null', () => {
      expect(adaptInstitutionalResponse(null as any, Category.TSE)).toBeNull()
    })

    it('returns null when stat is not OK', () => {
      const data = { stat: 'FAIL', data: [makeRow('2330', 'TSMC')] }
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

    it('maps rows correctly for TSE response', () => {
      const data = { stat: 'OK', data: [makeRow('2330', 'TSMC')] }
      const result = adaptInstitutionalResponse(data as any, Category.TSE)

      expect(result).toHaveLength(1)
      expect(result![0]).toEqual({
        code: '2330',
        name: 'TSMC',
        foreignBuy: 1000,
        foreignSell: 500,
        foreignNet: 500,
        trustBuy: 200,
        trustSell: 100,
        trustNet: 100,
        dealerNet: 50,
        totalNet: 650,
      })
    })
  })

  describe('OTC response', () => {
    it('returns null when data is null', () => {
      expect(adaptInstitutionalResponse(null as any, Category.OTC)).toBeNull()
    })

    it('returns null when aaData is empty', () => {
      const data = { aaData: [] }
      expect(adaptInstitutionalResponse(data as any, Category.OTC)).toBeNull()
    })

    it('returns null when aaData is missing', () => {
      const data = {}
      expect(adaptInstitutionalResponse(data as any, Category.OTC)).toBeNull()
    })

    it('maps rows correctly for OTC response', () => {
      const data = { aaData: [makeRow('6547', 'Stock')] }
      const result = adaptInstitutionalResponse(data as any, Category.OTC)

      expect(result).toHaveLength(1)
      expect(result![0].code).toBe('6547')
      expect(result![0].totalNet).toBe(650)
    })
  })
})
