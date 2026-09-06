import {
  FAVORITE_ADD_STOCK,
  FAVORITE_CREATE_FILE,
  FAVORITE_DELETE_STOCK,
  FAVORITE_IS_EXIST,
  FAVORITE_NOT_FOUND,
  FAVORITE_NOT_FOUND_STOCK_IN_FILE,
  FAVORITE_STOCK_IS_EXIST,
} from '@/messages/favorite'
import { getSecurityDirectory } from '@/services/security-directory'
import { Category } from '@/types/stock'
import FilePath from '@/utils/file'

import Favorite from './handler'

vi.mock('@/utils/file', () => ({
  default: {
    favorite: { read: vi.fn(), exist: vi.fn(), write: vi.fn() },
  },
}))

vi.mock('@/services/security-directory', () => ({
  getSecurityDirectory: vi.fn(),
}))

const directory = {
  '2330': { name: 'TSMC', category: Category.TSE },
  '6547': { name: 'Medigen', category: Category.OTC },
}

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.mocked(getSecurityDirectory).mockResolvedValue(directory)
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

    expect(getSecurityDirectory).toHaveBeenCalledOnce()
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
      expect.stringContaining(FAVORITE_NOT_FOUND_STOCK_IN_FILE)
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

    expect(getSecurityDirectory).not.toHaveBeenCalled()
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

    expect(getSecurityDirectory).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('fails when the favorite file does not exist', async () => {
    vi.mocked(FilePath.favorite.exist).mockReturnValue(false)

    await new Favorite('list').initialize()

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(FAVORITE_NOT_FOUND)
    )
  })
})
