import fs from 'fs'

function readFileSync(path, toJson = true, encoding = 'utf-8') {
  const data = fs.readFileSync(path, encoding)

  if (!toJson) {
    return data
  }

  return JSON.parse(data)
}

function writeFileSync(path, data) {
  return fs.writeFileSync(path, JSON.stringify(data))
}

function existFileSync(path) {
  return fs.existsSync(path)
}

export { readFileSync, writeFileSync, existFileSync }
