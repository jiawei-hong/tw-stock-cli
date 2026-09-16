import * as fs from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  configPath,
  readConfig,
  setConfigValue,
  unsetConfigValue,
  validateConfig,
  writeConfig,
} from '@/services/config'
import { Category } from '@/types/stock'

vi.mock('node:fs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:fs')>()),
}))

let directory: string

beforeEach(() => {
  directory = fs.mkdtempSync(join(tmpdir(), 'tw-stock-config-'))
  vi.stubEnv('XDG_CONFIG_HOME', directory)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  fs.rmSync(directory, { recursive: true, force: true })
})

it('uses the XDG config directory and returns empty defaults', () => {
  expect(configPath()).toBe(join(directory, 'tw-stock', 'config.json'))
  expect(readConfig()).toEqual({})
})

it('writes and reads validated configuration atomically', () => {
  writeConfig({ defaultMarket: Category.OTC, watchInterval: 10 })

  expect(readConfig()).toEqual({
    defaultMarket: Category.OTC,
    watchInterval: 10,
  })
  expect(fs.statSync(configPath()).mode & 0o777).toBe(0o600)
  expect(fs.readdirSync(join(directory, 'tw-stock'))).toEqual(['config.json'])
})

it.each([
  null,
  [],
  { defaultMarket: 'invalid' },
  { watchInterval: 4 },
  { watchInterval: 5.5 },
  { unknown: true },
])('rejects invalid configuration %j', (config) => {
  expect(() => validateConfig(config)).toThrow()
})

it('sets and unsets supported values', () => {
  const market = setConfigValue({}, 'default-market', 'otc')
  const configured = setConfigValue(market, 'watch-interval', '15')
  expect(configured).toEqual({
    defaultMarket: Category.OTC,
    watchInterval: 15,
  })
  expect(unsetConfigValue(configured, 'default-market')).toEqual({
    watchInterval: 15,
  })
})

it('preserves the previous file if replacement fails', () => {
  writeConfig({ defaultMarket: Category.TSE })
  vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
    throw new Error('ENOSPC')
  })

  expect(() => writeConfig({ defaultMarket: Category.OTC })).toThrow('ENOSPC')
  expect(readConfig()).toEqual({ defaultMarket: Category.TSE })
  expect(fs.readdirSync(join(directory, 'tw-stock'))).toEqual(['config.json'])
})
