import { color } from '@/constants'

import {
  displayFailed,
  displaySuccess,
  getDisplayActionText,
  Status,
} from './text'

describe('getDisplayActionText', () => {
  it('wraps text in red for failed status', () => {
    expect(getDisplayActionText('hello', Status.failed)).toBe(
      `${color.red}hello${color.rest}`
    )
  })

  it('wraps text in green for success status', () => {
    expect(getDisplayActionText('hello', Status.success)).toBe(
      `${color.green}hello${color.rest}`
    )
  })
})

describe('displayFailed', () => {
  it('logs failure message in red', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    displayFailed('oops')
    expect(spy).toHaveBeenCalledWith(`${color.red}Failure: oops${color.rest}`)
    spy.mockRestore()
  })
})

describe('displaySuccess', () => {
  it('logs success message in green', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    displaySuccess('done')
    expect(spy).toHaveBeenCalledWith(`${color.green}Success: done${color.rest}`)
    spy.mockRestore()
  })
})
