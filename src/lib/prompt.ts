import cliSelect from 'cli-select'

import { displayFailed } from './text'

function getSelectedIndex() {
  enum IndicesStatus {
    TSE = 'TSE',
    OTC = 'OTC',
    FRMSA = 'FRMSA',
  }

  return cliSelect({ values: Object.values(IndicesStatus) })
    .then((res) => IndicesStatus[res.value])
    .catch(() => displayFailed('Cancelled!'))
}

export { getSelectedIndex }
