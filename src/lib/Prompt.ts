import cliSelect from 'cli-select'
import { displayFailed } from './Text'

function execute(choices: string[] = []) {
  if (choices.length === 0) {
    displayFailed('You should give options!')
  } else {
    return cliSelect({ values: choices })
      .then((res) => res.value)
      .catch(() => displayFailed('Cancelled!'))
  }
}

export { execute }
