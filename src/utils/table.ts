import { getBorderCharacters, TableUserConfig } from 'table'

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

export { tableConfig }
