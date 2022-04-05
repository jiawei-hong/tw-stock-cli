const path = require('path')
const { readFileSync, writeFileSync, existFileSync } = require('./file')

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

module.exports = FilePath
