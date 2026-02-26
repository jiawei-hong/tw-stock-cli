import type { FieldProps } from '@/types/field'
import { Category } from '@/types/stock'

import { BaseHandler, BaseOptions } from './base-handler'

// Concrete test subclass
class TestHandler extends BaseHandler<BaseOptions, { id: number }> {
  public mockUrl: string | null = 'https://test.com'
  public mockData: unknown = { stat: 'OK' }
  public mockRows: { id: number }[] | null = [{ id: 1 }, { id: 2 }]

  protected buildUrl(): string {
    return this.mockUrl!
  }

  protected fetchData(): Promise<unknown> {
    return Promise.resolve(this.mockData)
  }

  protected parseData(): { id: number }[] | null {
    return this.mockRows
  }

  protected getFields(): FieldProps[] {
    return [{ name: 'ID' }]
  }

  protected formatRow(row: { id: number }): string[] {
    return [String(row.id)]
  }

  protected getNotFoundMessage(): string {
    return 'Not found'
  }
}

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
  vi.clearAllMocks()
})

describe('BaseHandler', () => {
  describe('getCategory', () => {
    it('defaults to TSE when listed is not set', () => {
      const handler = new TestHandler({})
      // We test this indirectly through execute which calls getCategory
      expect(handler['getCategory']()).toBe(Category.TSE)
    })

    it('returns OTC when listed is OTC', () => {
      const handler = new TestHandler({ listed: Category.OTC })
      expect(handler['getCategory']()).toBe(Category.OTC)
    })
  })

  describe('processRows default', () => {
    it('returns rows unchanged by default', () => {
      const handler = new TestHandler({})
      const rows = [{ id: 1 }, { id: 2 }]
      expect(handler['processRows'](rows)).toBe(rows)
    })
  })

  describe('execute', () => {
    it('displays table on successful flow', async () => {
      const handler = new TestHandler({})
      await handler.execute()
      expect(consoleSpy).toHaveBeenCalled()
      // Should contain the table output (not a failure message)
      const output = consoleSpy.mock.calls[0][0]
      expect(output).not.toContain('Failure:')
    })

    it('calls displayFailed when url is falsy', async () => {
      const handler = new TestHandler({})
      handler.mockUrl = ''
      await handler.execute()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failure:')
      )
    })

    it('calls displayFailed when parseData returns null', async () => {
      const handler = new TestHandler({})
      handler.mockRows = null
      await handler.execute()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failure:')
      )
    })

    it('calls displayFailed when parseData returns empty array', async () => {
      const handler = new TestHandler({})
      handler.mockRows = []
      await handler.execute()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failure:')
      )
    })

    it('calls displayFailed with getNotFoundMessage text', async () => {
      const handler = new TestHandler({})
      handler.mockRows = null
      await handler.execute()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Not found')
      )
    })

    it('calls formatRow for each row', async () => {
      const handler = new TestHandler({})
      handler.mockRows = [{ id: 10 }, { id: 20 }, { id: 30 }]
      const formatSpy = vi.spyOn(handler, 'formatRow' as any)
      await handler.execute()
      expect(formatSpy).toHaveBeenCalledTimes(3)
    })

    it('uses date from options', async () => {
      const handler = new TestHandler({ date: '2024-03-15' })
      const getDateSpy = vi.spyOn(handler as any, 'getDate')
      await handler.execute()
      expect(getDateSpy).toHaveBeenCalledWith(Category.TSE)
    })

    it('uses OTC category from options', async () => {
      const handler = new TestHandler({ listed: Category.OTC })
      const buildUrlSpy = vi.spyOn(handler as any, 'buildUrl')
      await handler.execute()
      expect(buildUrlSpy).toHaveBeenCalledWith(
        expect.any(String),
        Category.OTC
      )
    })
  })
})
