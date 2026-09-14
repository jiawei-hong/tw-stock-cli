import Favorite from '@/commands/favorite/handler'
import {
  FAVORITE_ADD_STOCK,
  FAVORITE_CREATE_FILE,
  FAVORITE_DELETE_STOCK,
  FAVORITE_IS_EXIST,
  FAVORITE_NOT_FOUND,
  FAVORITE_STOCK_IS_EXIST,
} from '@/messages/favorite'
import { getMarketSymbols } from '@/services/market-symbols'
import { Category } from '@/types/stock'
import FilePath from '@/utils/file'

vi.mock('@/utils/file', () => ({
  default: {
    favorite: { read: vi.fn(), exist: vi.fn(), write: vi.fn() },
  },
}))

vi.mock('@/services/market-symbols', () => ({
  getMarketSymbols: vi.fn(),
}))

const directory = {
  '2330': { name: 'TSMC', category: Category.TSE },
  '6547': { name: 'Medigen', category: Category.OTC },
}

let consoleSpy: ReturnType<typeof vi.spyOn>

it('uses responsive output in a narrow terminal', async () => {
  const originalColumns = process.stdout.columns
  Object.defineProperty(process.stdout, 'columns', {
    value: 20,
    configurable: true,
  })
  try {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
    vi.mocked(FilePath.favorite.read).mockReturnValue({
      stockCodes: ['2330', '9999'],
    })
    await new Favorite('list').initialize()
    expect(consoleSpy.mock.calls[0][0]).toContain('股票代碼: 2330')
    expect(consoleSpy.mock.calls[0][0]).toContain('股票代碼: 9999')
    for (const [output] of consoleSpy.mock.calls) {
      for (const line of String(output).split('\n')) {
        expect(stringWidth(line)).toBeLessThanOrEqual(20)
      }
    }
  } finally {
    Object.defineProperty(process.stdout, 'columns', {
      value: originalColumns,
      configurable: true,
    })
  }
})

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.mocked(getMarketSymbols).mockResolvedValue(directory)
})

afterEach(() => {
  consoleSpy.mockRestore()
  vi.clearAllMocks()
})

describe('Favorite', () => {
  it('creates favorite file when it does not exist', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(false)

    await new Favorite('create').initialize()

    expect(FilePath.favorite.write).toHaveBeenCalledWith({ stockCodes: [] })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(FAVORITE_CREATE_FILE)
    )
  })

  it('fails when favorite file already exists', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)

    await new Favorite('create').initialize()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(FAVORITE_IS_EXIST)
    )
  })

  it('adds a directory-listed stock code to favorites', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
    vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: [] })

    await new Favorite('add', '2330').initialize()

    expect(getMarketSymbols).toHaveBeenCalledWith(['2330'])
    expect(FilePath.favorite.write).toHaveBeenCalledWith({
      stockCodes: ['2330'],
    })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(FAVORITE_ADD_STOCK)
    )
  })

  it('fails when stock code is not in the directory', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
    vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: [] })

    await new Favorite('add', '9999').initialize()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('MIS could not resolve this stock code')
    )
  })

  it('fails when stock already exists in favorites', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
    vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: ['2330'] })

    await new Favorite('add', '2330').initialize()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(FAVORITE_STOCK_IS_EXIST)
    )
  })

  it('deletes a favorite without directory lookup', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
    vi.mocked(FilePath.favorite.read).mockReturnValue({
      stockCodes: ['2330', '6547'],
    })

    await new Favorite('delete', '2330').initialize()

    expect(getMarketSymbols).not.toHaveBeenCalled()
    expect(FilePath.favorite.write).toHaveBeenCalledWith({
      stockCodes: ['6547'],
    })
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(FAVORITE_DELETE_STOCK)
    )
  })

  it('lists favorites using the directory for names', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
    vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: ['2330'] })

    await new Favorite('list').initialize()

    expect(getMarketSymbols).toHaveBeenCalledWith(['2330'])
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('fails when the favorite file does not exist', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(false)

    await new Favorite('list').initialize()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(FAVORITE_NOT_FOUND)
    )
  })

  it('preserves saved codes and displays them when names cannot be fetched', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
    vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: ['2330'] })
    vi.mocked(getMarketSymbols).mockRejectedValue(new Error('Offline'))
    await new Favorite('list').initialize()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2330'))
    expect(FilePath.favorite.write).not.toHaveBeenCalled()
  })

  it('does not write a favorite when lookup fails', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
    vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: [] })
    vi.mocked(getMarketSymbols).mockRejectedValue(new Error('Offline'))
    await new Favorite('add', '2330').initialize()
    expect(FilePath.favorite.write).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Offline'))
  })
})
import stringWidth from 'string-width'
