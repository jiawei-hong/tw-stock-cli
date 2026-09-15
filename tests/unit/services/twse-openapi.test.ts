import {
  formatRocDate,
  formatRocMonth,
  getTwseOpenData,
} from '@/services/twse-openapi'
import { requestJson } from '@/utils/http'

vi.mock('@/utils/http', () => ({ requestJson: vi.fn() }))

it('converts ROC dates and months', () => {
  expect(formatRocDate('1150915')).toBe('2026-09-15')
  expect(formatRocDate('115/09/15')).toBe('2026-09-15')
  expect(formatRocMonth('11509')).toBe('2026-09')
})

it('validates TWSE OpenAPI arrays', async () => {
  vi.mocked(requestJson).mockResolvedValueOnce([{ Code: '2330' }])
  await expect(getTwseOpenData('example')).resolves.toEqual([{ Code: '2330' }])
  vi.mocked(requestJson).mockResolvedValueOnce({})
  await expect(getTwseOpenData('example')).rejects.toThrow(
    'Invalid TWSE OpenAPI response'
  )
})

it.each([[null], [1], [['invalid']]])(
  'rejects invalid API records %j',
  async (record) => {
    vi.mocked(requestJson).mockResolvedValueOnce([record])
    await expect(getTwseOpenData('example')).rejects.toThrow(
      'Invalid TWSE OpenAPI response'
    )
  }
)
