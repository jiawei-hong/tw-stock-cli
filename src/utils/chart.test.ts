import {
  CHART_NOT_FOUND,
  CHART_START_DATE_IS_AFTER_END_DATE,
} from '@/messages/chart'

import { draw, filterDrawChartDataWithTwoTime } from './chart'

let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  consoleSpy.mockRestore()
})

describe('draw', () => {
  it('draws chart when data is non-empty', () => {
    draw([{ c: '100' }, { c: '101' }, { c: '99' }])
    expect(consoleSpy).toHaveBeenCalledTimes(1)
  })

  it('displays error when data is empty', () => {
    draw([])
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(CHART_NOT_FOUND)
    )
  })
})

describe('filterDrawChartDataWithTwoTime', () => {
  it('filters data within time range', () => {
    const data = [
      { ts: '0930', c: '100' },
      { ts: '1030', c: '101' },
      { ts: '1200', c: '102' },
    ]
    const result = filterDrawChartDataWithTwoTime(data, ['0900', '1100'])
    expect(result).toHaveLength(2)
  })

  it('returns error when start date is after end date', () => {
    const data = [{ ts: '0930', c: '100' }]
    filterDrawChartDataWithTwoTime(data, ['1300', '0900'])
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(CHART_START_DATE_IS_AFTER_END_DATE)
    )
  })

  it('filters out entries without ts key', () => {
    const data = [{ c: '100' }, { ts: '1000', c: '101' }]
    const result = filterDrawChartDataWithTwoTime(data, ['0900', '1100'])
    expect(result).toHaveLength(1)
  })
})
