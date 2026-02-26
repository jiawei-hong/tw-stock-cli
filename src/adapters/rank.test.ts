import { Category } from '@/types/stock'

import { adaptRankResponse } from './rank'

describe('adaptRankResponse', () => {
  describe('TSE response', () => {
    it('returns null when data is null', () => {
      expect(adaptRankResponse(null as any, Category.TSE)).toBeNull()
    })

    it('returns null when stat is not OK', () => {
      const data = { stat: 'FAIL', tables: [] }
      expect(adaptRankResponse(data as any, Category.TSE)).toBeNull()
    })

    it('returns null when tables is missing', () => {
      const data = { stat: 'OK' }
      expect(adaptRankResponse(data as any, Category.TSE)).toBeNull()
    })

    it('returns null when 每日收盤行情 table not found', () => {
      const data = {
        stat: 'OK',
        tables: [{ title: 'Other Table', data: [] }],
      }
      expect(adaptRankResponse(data as any, Category.TSE)).toBeNull()
    })

    it('returns null when matching table has no data', () => {
      const data = {
        stat: 'OK',
        tables: [{ title: '每日收盤行情', data: null }],
      }
      expect(adaptRankResponse(data as any, Category.TSE)).toBeNull()
    })

    it('filters out rows where close is 0', () => {
      const data = {
        stat: 'OK',
        tables: [
          {
            title: '每日收盤行情',
            data: [
              // row[0]=code, row[1]=name, row[2]=volume, ... row[8]=close, row[9]=direction, row[10]=change
              ['2330', 'TSMC', '1,000', '', '', '', '', '', '0', '+', '0'],
            ],
          },
        ],
      }
      const result = adaptRankResponse(data as any, Category.TSE)
      expect(result).toEqual([])
    })

    it('maps valid TSE rows correctly', () => {
      const data = {
        stat: 'OK',
        tables: [
          {
            title: '每日收盤行情',
            data: [
              [
                '2330',
                'TSMC',
                '50,000',
                '',
                '',
                '',
                '',
                '',
                '600.00',
                '+',
                '15.00',
              ],
            ],
          },
        ],
      }
      const result = adaptRankResponse(data as any, Category.TSE)

      expect(result).toHaveLength(1)
      expect(result![0].code).toBe('2330')
      expect(result![0].name).toBe('TSMC')
      expect(result![0].close).toBe(600)
      expect(result![0].change).toBe(15)
      expect(result![0].volume).toBe(50000)
      expect(result![0].changePercent).toBeCloseTo((15 / 585) * 100, 2)
    })

    it('handles negative change via parseTseChange', () => {
      const data = {
        stat: 'OK',
        tables: [
          {
            title: '每日收盤行情',
            data: [
              [
                '2330',
                'TSMC',
                '50,000',
                '',
                '',
                '',
                '',
                '',
                '600.00',
                '-',
                '10.00',
              ],
            ],
          },
        ],
      }
      const result = adaptRankResponse(data as any, Category.TSE)
      expect(result![0].change).toBe(-10)
    })
  })

  describe('OTC response', () => {
    it('returns null when tables is missing', () => {
      const data = {}
      expect(adaptRankResponse(data as any, Category.OTC)).toBeNull()
    })

    it('returns null when first table has no data', () => {
      const data = { tables: [{ data: [] }] }
      expect(adaptRankResponse(data as any, Category.OTC)).toBeNull()
    })

    it('maps valid OTC rows correctly', () => {
      // OTC: row[0]=code, row[1]=name, row[2]=close, row[3]=change, ... row[8]=volume
      const data = {
        tables: [
          {
            data: [
              ['6547', 'Stock', '120.00', '5.00', '', '', '', '', '30,000'],
            ],
          },
        ],
      }
      const result = adaptRankResponse(data as any, Category.OTC)

      expect(result).toHaveLength(1)
      expect(result![0].code).toBe('6547')
      expect(result![0].close).toBe(120)
      expect(result![0].change).toBe(5)
      expect(result![0].volume).toBe(30000)
    })

    it('filters out rows where close is 0', () => {
      const data = {
        tables: [
          {
            data: [['6547', 'Stock', '0', '0', '', '', '', '', '1,000']],
          },
        ],
      }
      const result = adaptRankResponse(data as any, Category.OTC)
      expect(result).toEqual([])
    })
  })
})
