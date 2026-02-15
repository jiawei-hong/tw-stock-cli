import * as fs from 'fs'

function readFileSync(path: string) {
  const data = fs.readFileSync(path, 'utf-8')

  return JSON.parse(data)
}

function writeFileSync(path: string, data: any): void {
  return fs.writeFileSync(path, JSON.stringify(data))
}

function existFileSync(path: string): boolean {
  return fs.existsSync(path)
}

enum File {
  stock,
  favorite,
}

type TFile = {
  read: any
  exist: () => boolean
  write: (data: any) => void
}

type IFile = {
  [key: string]: TFile
}

const FilePath: IFile = {}

for (let key in File) {
  const path = `./${key}.json`

  FilePath[key] = {
    read() {
      return readFileSync(path)
    },
    exist() {
      return existFileSync(path)
    },
    write(data) {
      writeFileSync(path, data)
    },
  }
}

export default FilePath
