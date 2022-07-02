import cliSelect from 'cli-select'
import { IndicesStatus } from '../handler/Indices'
import { displayFailed } from './Text'

function execute() {
  return cliSelect({ values: Object.values(IndicesStatus) })
    .then((res) => IndicesStatus[res.value])
    .catch(() => displayFailed('Cancelled!'))
}

export { execute }
