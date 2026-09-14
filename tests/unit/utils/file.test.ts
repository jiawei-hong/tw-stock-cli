import * as fs from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

import FilePath from '@/utils/file'

vi.mock('fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('fs')>()),
}))

let directory: string
let originalDirectory: string
const originalContents = '{ "stockCodes": ["2330", "00632R"] }\n'

beforeEach(() => {
  originalDirectory = process.cwd()
  directory = fs.mkdtempSync(join(tmpdir(), 'favorite-persistence-'))
  process.chdir(directory)
})

afterEach(() => {
  vi.restoreAllMocks()
  process.chdir(originalDirectory)
  fs.rmSync(directory, { recursive: true, force: true })
})

describe('FilePath.favorite', () => {
  it('checks existence and creates an empty favorite file', () => {
    expect(FilePath.favorite.exist()).toBe(false)
    FilePath.favorite.write({ stockCodes: [] })
    expect(FilePath.favorite.exist()).toBe(true)
    expect(FilePath.favorite.read()).toEqual({ stockCodes: [] })
    expect(fs.readdirSync('.')).toEqual(['favorite.json'])
  })

  it('reads existing codes without normalizing or dropping fields', () => {
    const data = { stockCodes: ['2330', '00632R', '2330'], extra: true }
    fs.writeFileSync('favorite.json', JSON.stringify(data))
    expect(FilePath.favorite.read()).toEqual(data)
  })

  it('replaces the old file only after writing complete JSON', () => {
    fs.writeFileSync('favorite.json', originalContents)
    const rename = fs.renameSync
    const renameSpy = vi
      .spyOn(fs, 'renameSync')
      .mockImplementation((source, destination) => {
        expect(fs.readFileSync('favorite.json', 'utf-8')).toBe(originalContents)
        expect(JSON.parse(fs.readFileSync(source, 'utf-8'))).toEqual({
          stockCodes: ['0050'],
        })
        rename(source, destination)
      })
    FilePath.favorite.write({ stockCodes: ['0050'] })
    expect(renameSpy).toHaveBeenCalledOnce()
    expect(FilePath.favorite.read()).toEqual({ stockCodes: ['0050'] })
    expect(fs.readdirSync('.')).toEqual(['favorite.json'])
  })

  it.each([
    '{',
    '',
    'null',
    '[]',
    '{}',
    '{"stockCodes":"2330"}',
    '{"stockCodes":[2330]}',
    '{"stockCodes":[null]}',
    '{"stockCodes":[""]}',
    '{"stockCodes":[" "]}',
  ])(
    'rejects corrupt data %j on read and refuses to overwrite it',
    (contents) => {
      fs.writeFileSync('favorite.json', contents)
      expect(() => FilePath.favorite.read()).toThrow(
        /Invalid .*favorite.json.*Back up and repair/
      )
      expect(() => FilePath.favorite.write({ stockCodes: ['0050'] })).toThrow(
        /Cannot save .*favorite.json/
      )
      expect(fs.readFileSync('favorite.json', 'utf-8')).toBe(contents)
      expect(fs.readdirSync('.')).toEqual(['favorite.json'])
    }
  )

  it.each([
    null,
    [],
    {},
    { stockCodes: [2330] },
    { stockCodes: [''] },
    { stockCodes: new Array(1) },
    { stockCodes: [], toJSON: () => ({}) },
  ])('rejects invalid write payload %j without changing saved data', (data) => {
    fs.writeFileSync('favorite.json', originalContents)
    expect(() => FilePath.favorite.write(data)).toThrow(/stockCodes/)
    expect(fs.readFileSync('favorite.json', 'utf-8')).toBe(originalContents)
    expect(fs.readdirSync('.')).toEqual(['favorite.json'])
  })

  it.each(['mkdtempSync', 'writeFileSync', 'renameSync'] as const)(
    'preserves old bytes and cleans temporary files when %s fails',
    (operation) => {
      fs.writeFileSync('favorite.json', originalContents)
      const write = fs.writeFileSync
      vi.spyOn(fs, operation).mockImplementationOnce((...args: unknown[]) => {
        if (operation === 'writeFileSync') write(args[0] as string, 'partial')
        throw new Error('EACCES: simulated failure')
      })
      expect(() => FilePath.favorite.write({ stockCodes: ['0050'] })).toThrow(
        /Cannot save .*favorite.json.*EACCES/
      )
      expect(fs.readFileSync('favorite.json', 'utf-8')).toBe(originalContents)
      expect(fs.readdirSync('.')).toEqual(['favorite.json'])
    }
  )

  it('leaves no favorite file after a failed initial save', () => {
    vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
      throw new Error('ENOSPC')
    })
    expect(() => FilePath.favorite.write({ stockCodes: [] })).toThrow(/ENOSPC/)
    expect(fs.readdirSync('.')).toEqual([])
  })

  it('reports missing files with their path and recovery guidance', () => {
    expect(() => FilePath.favorite.read()).toThrow(
      /Cannot read .*favorite.json.*exists and is readable/
    )
  })

  it('preserves the file when reading before a write fails', () => {
    fs.writeFileSync('favorite.json', originalContents)
    vi.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
      throw new Error('EACCES')
    })
    expect(() => FilePath.favorite.write({ stockCodes: [] })).toThrow(
      /Cannot read .*favorite.json.*EACCES/
    )
    expect(fs.readFileSync('favorite.json', 'utf-8')).toBe(originalContents)
  })
})
