import { getBorderCharacters, TableUserConfig } from 'table'

const tableConfig: TableUserConfig = {
  border: getBorderCharacters(`ramac`),
  columnDefault: {
    alignment: 'center',
  },
}

export { tableConfig }
