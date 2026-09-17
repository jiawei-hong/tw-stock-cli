import Events from '@/commands/events/handler'
import Fundamentals from '@/commands/fundamentals/handler'
import Institutional from '@/commands/institutional/handler'
import Overview from '@/commands/overview/handler'
import RealtimeStock from '@/commands/stock/realtime-handler'
import { Category } from '@/types/stock'

vi.mock('@/commands/events/handler')
vi.mock('@/commands/fundamentals/handler')
vi.mock('@/commands/institutional/handler')
vi.mock('@/commands/stock/realtime-handler')

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-30T16:01:00Z'))
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('uses the Taipei date and market consistently across all sections', async () => {
  await new Overview(' 00679b ', Category.OTC).execute()
  expect(RealtimeStock).toHaveBeenCalledWith('00679B', { listed: Category.OTC })
  expect(Fundamentals).toHaveBeenCalledWith('00679B', Category.OTC)
  expect(Institutional).toHaveBeenCalledWith('00679B', {
    listed: Category.OTC,
    date: '2026-10-01',
  })
  expect(Events).toHaveBeenCalledWith('00679B', '2026-10', Category.OTC)
})

it('continues through later sections after a quote failure', async () => {
  vi.mocked(RealtimeStock.prototype.execute).mockRejectedValueOnce(
    new Error('offline')
  )
  await new Overview('2330').execute()
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('offline'))
  expect(Fundamentals.prototype.execute).toHaveBeenCalledOnce()
  expect(Institutional.prototype.execute).toHaveBeenCalledOnce()
  expect(Events.prototype.execute).toHaveBeenCalledOnce()
})

it('rejects invalid input before loading any section', async () => {
  await expect(new Overview('2330-0050').execute()).rejects.toThrow(
    'stock code'
  )
  expect(RealtimeStock).not.toHaveBeenCalled()
})
