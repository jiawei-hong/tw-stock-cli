const path = require('path')

const pathKeys = ['stock', 'favorite']
const FilePath = {}

for (let key of pathKeys) {
  FilePath[key] = path.resolve('./', `${key}.json`)
}

module.exports = FilePath
