import stringWidth from 'string-width'

import { Category, TStock } from '@/types/stock'

import Field from './field'
import { renderStockTable } from './render'

describe('responsive stock tables', () => {
  const originalColumns = process.stdout.columns
  afterEach(() => {
    Object.defineProperty(process.stdout, 'columns', {
      value: originalColumns,
      configurable: true,
    })
    vi.restoreAllMocks()
  })

  it.each([20, 40, 59, 60, 80, 120, 200])(
    'fits a %i-column terminal without losing quote context',
    (width) => {
      Object.defineProperty(process.stdout, 'columns', {
        value: width,
        configurable: true,
      })
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      renderStockTable(
        [
          {
            c: '00679B',
            n: '元大美國政府二十年期以上債券基金',
            ex: Category.OTC,
            z: '-',
            y: '100',
            d: '20260904',
            t: '13:30:00',
          } as TStock,
        ],
        Field.basic({ details: true })
      )
      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('00679B')
      expect(output.replace(/\s|[|+\-]/g, '')).toContain('無成交價')
      expect(output).toContain('2026-09-04')
      for (const line of output.split('\n'))
        expect(stringWidth(line)).toBeLessThanOrEqual(width)
      const nameCells =
        width >= 60
          ? output
              .split('\n')
              .map(
                (line) => line.split('|')[output.includes('類別') ? 3 : 2] ?? ''
              )
              .join('')
          : output
      expect(nameCells.replace(/\s|[|+\-]/g, '')).toContain(
        '元大美國政府二十年期以上債券基金'
      )
    }
  )
})
