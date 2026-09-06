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

type TFile = {
  read: any
  exist: () => boolean
  write: (data: any) => void
}

type IFile = {
  [key: string]: TFile
}

const path = './favorite.json'
const FilePath: IFile = {
  favorite: {
    read: () => readFileSync(path),
    exist: () => existFileSync(path),
    write: (data) => writeFileSync(path, data),
  },
}

export default FilePath
