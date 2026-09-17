import * as fs from 'fs'
import { dirname, join } from 'path'

import { configPath } from '@/services/config'

type FavoriteData = {
  stockCodes: string[]
}

function favoritePath(): string {
  return join(dirname(configPath()), 'favorite.json')
}

function validateFavorite(data: unknown): asserts data is FavoriteData {
  if (
    typeof data !== 'object' ||
    data === null ||
    Array.isArray(data) ||
    !('stockCodes' in data) ||
    !Array.isArray(data.stockCodes) ||
    !data.stockCodes.every(
      (code: unknown) => typeof code === 'string' && code.trim().length > 0
    )
  ) {
    throw new Error(
      'Expected an object with stockCodes: an array of non-empty strings.'
    )
  }
}

function readFavorite(path = favoritePath()): FavoriteData {
  let contents: string
  try {
    contents = fs.readFileSync(path, 'utf-8')
  } catch (error) {
    throw new Error(
      `Cannot read ${path}. Check that it exists and is readable: ${String(
        error
      )}`
    )
  }
  try {
    const data: unknown = JSON.parse(contents)
    validateFavorite(data)
    return data
  } catch (error) {
    throw new Error(
      `Invalid ${path}. Back up and repair the file before retrying; it has not been changed: ${String(
        error
      )}`
    )
  }
}

function writeFavorite(data: unknown): void {
  const path = favoritePath()
  let temporaryDirectory: string | undefined
  try {
    validateFavorite(data)
    const contents = JSON.stringify(data)
    validateFavorite(JSON.parse(contents))
    if (fs.existsSync(path)) readFavorite()
    fs.mkdirSync(dirname(path), { recursive: true })
    temporaryDirectory = fs.mkdtempSync(join(dirname(path), '.favorite-'))
    const temporaryPath = join(temporaryDirectory, 'favorite.json')
    fs.writeFileSync(temporaryPath, contents, { encoding: 'utf-8', flag: 'wx' })
    fs.renameSync(temporaryPath, path)
  } catch (error) {
    throw new Error(
      `Cannot save ${path}; existing data has not been changed. Check the data and directory permissions, then retry: ${String(
        error
      )}`
    )
  } finally {
    if (temporaryDirectory) {
      try {
        fs.rmSync(temporaryDirectory, { recursive: true, force: true })
      } catch {}
    }
  }
}

const FilePath = {
  favorite: {
    read: readFavorite,
    path: favoritePath,
    import: (source: string) => {
      const incoming = readFavorite(source)
      const existing = fs.existsSync(favoritePath())
        ? readFavorite()
        : { stockCodes: [] }
      writeFavorite({
        ...existing,
        stockCodes: [
          ...new Set([...existing.stockCodes, ...incoming.stockCodes]),
        ],
      })
    },
    exist: () => fs.existsSync(favoritePath()),
    write: writeFavorite,
  },
}

export default FilePath
