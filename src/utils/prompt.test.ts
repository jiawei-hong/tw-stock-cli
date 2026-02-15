import cliSelect from 'cli-select'

import { getSelectedIndex } from './prompt'

vi.mock('cli-select', () => ({
  default: vi.fn(),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getSelectedIndex', () => {
  it('returns TSE when selected', async () => {
    vi.mocked(cliSelect).mockResolvedValue({
      id: 0,
      value: 'TSE' as any,
    })
    expect(await getSelectedIndex()).toBe('TSE')
  })

  it('returns OTC when selected', async () => {
    vi.mocked(cliSelect).mockResolvedValue({
      id: 1,
      value: 'OTC' as any,
    })
    expect(await getSelectedIndex()).toBe('OTC')
  })

  it('returns FRMSA when selected', async () => {
    vi.mocked(cliSelect).mockResolvedValue({
      id: 2,
      value: 'FRMSA' as any,
    })
    expect(await getSelectedIndex()).toBe('FRMSA')
  })

  it('displays failure when cancelled', async () => {
    vi.mocked(cliSelect).mockRejectedValue(new Error('cancelled'))
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await getSelectedIndex()
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Cancelled!'))
    spy.mockRestore()
  })
})
