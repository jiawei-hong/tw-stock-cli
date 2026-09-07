import stringWidth from 'string-width'
import { table } from 'table'

import InstitutionalField from '@/commands/institutional/field'
import RankField from '@/commands/rank/field'

import { getTableHeader, responsiveTable, tableConfig } from './table'

const name = '元大美國政府二十年期以上債券基金'
const cases = [
  {
    title: 'favorites',
    nameColumn: 0,
    data: [
      ['公司簡稱', '股票代碼'],
      [name, '00679B'],
      ['-', '2330'],
    ],
  },
  {
    title: 'ranking',
    nameColumn: 2,
    data: [
      getTableHeader(RankField.ranking()),
      [
        '1',
        '00679B',
        name,
        '1234.50',
        '\u001b[31m+12.50\u001b[0m',
        '+1.02%',
        '123,456,789',
      ],
    ],
  },
  {
    title: 'institutional stock',
    nameColumn: 1,
    data: [
      getTableHeader(InstitutionalField.stock()),
      ['00679B', name, '+123,456,789', '-987,654,321', '0', '-864,197,532'],
    ],
  },
  {
    title: 'institutional summary',
    nameColumn: 0,
    data: [
      getTableHeader(InstitutionalField.summary()),
      [
        '外資及陸資（不含外資自營商）',
        '123,456,789,000',
        '987,654,321,000',
        '-864,197,532,000',
      ],
    ],
  },
]

describe.each(cases)('$title responsive table', ({ data, nameColumn }) => {
  it.each([6, 20, 40, 59, 60, 80, 100, 120, 200])(
    'fits %i columns and retains every field',
    (width) => {
      const output = responsiveTable(data, nameColumn, width)
      for (const line of output.split('\n')) {
        expect(stringWidth(line)).toBeLessThanOrEqual(width)
      }
      const cells = output
        .split('\n')
        .filter((line) => line.startsWith('|'))
        .map((line) => line.split('|').slice(1, -1))
      const normalize = (value: string) =>
        value.replace(/\u001b\[[0-9;]*m/g, '').replace(/\s/g, '')
      const streams = Array.from(
        { length: Math.max(...cells.map((row) => row.length)) },
        (_, column) => normalize(cells.map((row) => row[column] ?? '').join(''))
      )
      for (const row of data) {
        for (const value of row) {
          expect(
            streams.some((stream) => stream.includes(normalize(value)))
          ).toBe(true)
        }
      }
    }
  )

  it.each([0, 5, NaN, Infinity, 500])(
    'keeps the full layout at width %s',
    (width) => {
      expect(responsiveTable(data, nameColumn, width)).toBe(
        table(data, tableConfig)
      )
    }
  )
})

it('wraps the name in columns when numeric columns fit', () => {
  const output = responsiveTable(cases[0].data, 0, 30)
  expect(output).not.toContain('公司簡稱:')
  expect(output).toContain('00679B')
  expect(output).not.toContain(name)
})

it('keeps empty favorite headers in a narrow terminal', () => {
  const output = responsiveTable([cases[0].data[0]], 0, 20)
  expect(output).toContain('公司簡稱')
  expect(output).toContain('股票代碼')
  expect(output.split('\n').every((line) => stringWidth(line) <= 20)).toBe(true)
})
