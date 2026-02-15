import {
  FAVORITE_ADD_STOCK,
  FAVORITE_CREATE_FILE,
  FAVORITE_DELETE_STOCK,
  FAVORITE_IS_EXIST,
  FAVORITE_NOT_FOUND,
  FAVORITE_NOT_FOUND_STOCK_IN_FILE,
  FAVORITE_STOCK_IS_EXIST,
} from '@/messages/favorite'
import { STOCK_NOT_FOUND_FILE } from '@/messages/stock'
import FilePath from '@/utils/file'

import Favorite from './handler'

vi.mock('@/utils/file', () => ({
  default: {
    stock: {
      read: vi.fn(),
      write: vi.fn(),
      exist: vi.fn(),
    },
    favorite: {
      read: vi.fn(),
      write: vi.fn(),
      exist: vi.fn(),
    },
  },
}))

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
  vi.clearAllMocks()
})

describe('Favorite', () => {
  describe('create', () => {
    it('creates favorite file when it does not exist', () => {
      vi.mocked(FilePath.stock.exist).mockReturnValue(true)
      vi.mocked(FilePath.favorite.exist).mockReturnValue(false)

      new Favorite('create').initialize()

      expect(FilePath.favorite.write).toHaveBeenCalledWith({ stockCodes: [] })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_CREATE_FILE)
      )
    })

    it('fails when favorite file already exists', () => {
      vi.mocked(FilePath.stock.exist).mockReturnValue(true)
      vi.mocked(FilePath.favorite.exist).mockReturnValue(true)

      new Favorite('create').initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_IS_EXIST)
      )
    })
  })

  describe('add', () => {
    beforeEach(() => {
      vi.mocked(FilePath.stock.exist).mockReturnValue(true)
      vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
      vi.mocked(FilePath.stock.read).mockReturnValue({
        '2330': { name: 'TSMC', category: 'tse' },
      })
    })

    it('adds stock code to favorites', () => {
      vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: [] })

      new Favorite('add', '2330').initialize()

      expect(FilePath.favorite.write).toHaveBeenCalledWith({
        stockCodes: ['2330'],
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_ADD_STOCK)
      )
    })

    it('fails when stock already in favorites', () => {
      vi.mocked(FilePath.favorite.read).mockReturnValue({
        stockCodes: ['2330'],
      })

      new Favorite('add', '2330').initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_STOCK_IS_EXIST)
      )
    })

    it('fails when stock code not found in stock file', () => {
      vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: [] })
      vi.mocked(FilePath.stock.read).mockReturnValue({})

      new Favorite('add', '9999').initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_NOT_FOUND_STOCK_IN_FILE)
      )
    })

    it('uppercases the stock code', () => {
      vi.mocked(FilePath.favorite.read).mockReturnValue({ stockCodes: [] })

      new Favorite('add', '2330').initialize()

      expect(FilePath.favorite.write).toHaveBeenCalledWith({
        stockCodes: ['2330'],
      })
    })
  })

  describe('delete', () => {
    beforeEach(() => {
      vi.mocked(FilePath.stock.exist).mockReturnValue(true)
      vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
      vi.mocked(FilePath.stock.read).mockReturnValue({})
    })

    it('deletes stock code from favorites', () => {
      vi.mocked(FilePath.favorite.read).mockReturnValue({
        stockCodes: ['2330', '2317'],
      })

      new Favorite('delete', '2330').initialize()

      expect(FilePath.favorite.write).toHaveBeenCalledWith({
        stockCodes: ['2317'],
      })
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_DELETE_STOCK)
      )
    })

    it('fails when stock code not in favorites', () => {
      vi.mocked(FilePath.favorite.read).mockReturnValue({
        stockCodes: ['2317'],
      })

      new Favorite('delete', '2330').initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_NOT_FOUND_STOCK_IN_FILE)
      )
    })
  })

  describe('list', () => {
    it('displays table of favorite stocks', () => {
      vi.mocked(FilePath.stock.exist).mockReturnValue(true)
      vi.mocked(FilePath.favorite.exist).mockReturnValue(true)
      vi.mocked(FilePath.stock.read).mockReturnValue({
        '2330': { name: 'TSMC', category: 'tse' },
      })
      vi.mocked(FilePath.favorite.read).mockReturnValue({
        stockCodes: ['2330'],
      })

      new Favorite('list').initialize()

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('error conditions', () => {
    it('displays error when stock.json does not exist', () => {
      vi.mocked(FilePath.stock.exist).mockReturnValue(false)

      new Favorite('list').initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(STOCK_NOT_FOUND_FILE)
      )
    })

    it('displays error when favorite.json does not exist for non-create action', () => {
      vi.mocked(FilePath.stock.exist).mockReturnValue(true)
      vi.mocked(FilePath.favorite.exist).mockReturnValue(false)

      new Favorite('list').initialize()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(FAVORITE_NOT_FOUND)
      )
    })
  })
})
