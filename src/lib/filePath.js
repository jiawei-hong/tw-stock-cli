import path from 'path'
import { readFileSync, writeFileSync, existFileSync } from './file'

const pathKeys = ['stock', 'favorite']
const FilePath = {}

for (let key of pathKeys) {
  FilePath[key] = {
    path: path.resolve('./', `${key}.json`),
    read() {
      return readFileSync(this.path)
    },
    exist() {
      return existFileSync(this.path)
    },
    write(data) {
      writeFileSync(this.path, data)
    },
  }
}

export default FilePath
