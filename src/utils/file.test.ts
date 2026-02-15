import FilePath from './file'

vi.mock('fs', () => {
  const store: Record<string, string> = {}
  const exists: Record<string, boolean> = {}
  return {
    readFileSync: vi.fn((path: string) => store[path] ?? '{}'),
    writeFileSync: vi.fn((path: string, data: string) => {
      store[path] = data
    }),
    existsSync: vi.fn((path: string) => exists[path] ?? false),
    __store: store,
    __exists: exists,
  }
})

let fsMock: {
  readFileSync: ReturnType<typeof vi.fn>
  writeFileSync: ReturnType<typeof vi.fn>
  existsSync: ReturnType<typeof vi.fn>
  __store: Record<string, string>
  __exists: Record<string, boolean>
}

beforeEach(async () => {
  fsMock = (await import('fs')) as any
})

afterEach(() => {
  vi.clearAllMocks()
  Object.keys(fsMock.__store).forEach((k) => delete fsMock.__store[k])
  Object.keys(fsMock.__exists).forEach((k) => delete fsMock.__exists[k])
})

describe('FilePath.stock', () => {
  it('read() parses JSON from stock.json', () => {
    fsMock.__store['./stock.json'] = '{"2330":{"name":"TSMC","category":"tse"}}'
    expect(FilePath.stock.read()).toEqual({
      '2330': { name: 'TSMC', category: 'tse' },
    })
    expect(fsMock.readFileSync).toHaveBeenCalledWith('./stock.json', 'utf-8')
  })

  it('write() stringifies and writes to stock.json', () => {
    FilePath.stock.write({ test: true })
    expect(fsMock.writeFileSync).toHaveBeenCalledWith(
      './stock.json',
      '{"test":true}'
    )
  })

  it('exist() checks stock.json existence', () => {
    fsMock.__exists['./stock.json'] = true
    expect(FilePath.stock.exist()).toBe(true)
    expect(fsMock.existsSync).toHaveBeenCalledWith('./stock.json')
  })
})

describe('FilePath.favorite', () => {
  it('read() parses JSON from favorite.json', () => {
    fsMock.__store['./favorite.json'] = '{"stockCodes":["2330"]}'
    expect(FilePath.favorite.read()).toEqual({ stockCodes: ['2330'] })
    expect(fsMock.readFileSync).toHaveBeenCalledWith('./favorite.json', 'utf-8')
  })

  it('write() stringifies and writes to favorite.json', () => {
    FilePath.favorite.write({ stockCodes: ['2330'] })
    expect(fsMock.writeFileSync).toHaveBeenCalledWith(
      './favorite.json',
      '{"stockCodes":["2330"]}'
    )
  })

  it('exist() checks favorite.json existence', () => {
    fsMock.__exists['./favorite.json'] = false
    expect(FilePath.favorite.exist()).toBe(false)
    expect(fsMock.existsSync).toHaveBeenCalledWith('./favorite.json')
  })
})
