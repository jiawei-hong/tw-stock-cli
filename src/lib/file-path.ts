import { readFileSync, writeFileSync, existFileSync } from './file'

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
