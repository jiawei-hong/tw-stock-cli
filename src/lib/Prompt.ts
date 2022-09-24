import cliSelect from 'cli-select'

import { displayFailed } from './Text'

function execute() {
  enum IndicesStatus {
    TSE = 'TSE',
    OTC = 'OTC',
    FRMSA = 'FRMSA',
  }

  return cliSelect({ values: Object.values(IndicesStatus) })
    .then((res) => IndicesStatus[res.value])
    .catch(() => displayFailed('Cancelled!'))
}

export { execute }
