import * as fs from 'fs'

function readFileSync(path: string) {
  const data = fs.readFileSync(path, 'utf-8')

  return JSON.parse(data)
}

// TODO: create stock & favorite type
function writeFileSync(path: string, data: any): void {
  return fs.writeFileSync(path, JSON.stringify(data))
}

function existFileSync(path: string): boolean {
  return fs.existsSync(path)
}

export { readFileSync, writeFileSync, existFileSync }
