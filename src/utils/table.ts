import stringWidth from 'string-width'
import { getBorderCharacters, table, TableUserConfig } from 'table'

import type { FieldProps } from '@/types/field'

const tableConfig: TableUserConfig = {
  border: getBorderCharacters(`ramac`),
  columnDefault: {
    alignment: 'center',
  },
}

export function getTableHeader(headerField: FieldProps[]): string[] {
  return headerField.map((field) => field.name)
}

export function responsiveTable(
  data: string[][],
  nameColumn: number,
  width = process.stdout.columns
): string {
  const output = table(data, tableConfig)
  if (
    !Number.isFinite(width) ||
    width < 6 ||
    output.split('\n').every((line) => stringWidth(line) <= width)
  ) {
    return output
  }

  const widths = data[0].map((_, column) =>
    Math.max(...data.flatMap((row) => row[column].split('\n').map(stringWidth)))
  )
  const available = width - (3 * widths.length + 1)
  const nameWidth =
    available -
    widths.reduce(
      (sum, size, column) => sum + (column === nameColumn ? 0 : size),
      0
    )
  if (nameWidth >= Math.max(8, stringWidth(data[0][nameColumn]))) {
    widths[nameColumn] = nameWidth
    return table(data, {
      ...tableConfig,
      columns: widths.map((size, column) => ({
        width: size,
        alignment: column === nameColumn ? 'left' : 'center',
      })),
    })
  }

  const [headers, ...rows] = data
  const cards = rows.length
    ? rows.map((row) =>
        row.map((value, column) => [`${headers[column]}: ${value}`])
      )
    : [headers.map((header) => [header])]
  return cards
    .map((card) =>
      table(card, {
        ...tableConfig,
        columnDefault: { width: width - 4, alignment: 'left' },
      })
    )
    .join('\n')
}

export { tableConfig }
