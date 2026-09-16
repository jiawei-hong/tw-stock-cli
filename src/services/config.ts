import * as fs from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import { Category } from '@/types/stock'

export type AppConfig = {
  defaultMarket?: Category
  watchInterval?: number
}

export type ConfigKey = 'default-market' | 'watch-interval'

function configDirectory(): string {
  const configured = process.env.XDG_CONFIG_HOME?.trim()
  return configured || join(homedir(), '.config')
}

export function configPath(): string {
  return join(configDirectory(), 'tw-stock', 'config.json')
}

export function validateConfig(value: unknown): AppConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('config must be a JSON object')
  }
  const config = value as Record<string, unknown>
  const unsupported = Object.keys(config).filter(
    (key) => !['defaultMarket', 'watchInterval'].includes(key)
  )
  if (unsupported.length) {
    throw new Error(`unsupported config keys: ${unsupported.join(', ')}`)
  }
  if (
    config.defaultMarket !== undefined &&
    config.defaultMarket !== Category.TSE &&
    config.defaultMarket !== Category.OTC
  ) {
    throw new Error('defaultMarket must be tse or otc')
  }
  if (
    config.watchInterval !== undefined &&
    (!Number.isInteger(config.watchInterval) ||
      (config.watchInterval as number) < 5 ||
      (config.watchInterval as number) > 2_147_483)
  ) {
    throw new Error('watchInterval must be an integer between 5 and 2147483')
  }
  return config as AppConfig
}

export function readConfig(): AppConfig {
  const path = configPath()
  if (!fs.existsSync(path)) return {}
  try {
    return validateConfig(JSON.parse(fs.readFileSync(path, 'utf8')))
  } catch (error) {
    throw new Error(`Invalid config at ${path}: ${String(error)}`)
  }
}

export function writeConfig(config: AppConfig): void {
  const validated = validateConfig(config)
  const path = configPath()
  const directory = dirname(path)
  fs.mkdirSync(directory, { recursive: true })
  const temporary = join(directory, `.config-${process.pid}-${Date.now()}.tmp`)
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(validated, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    })
    fs.renameSync(temporary, path)
  } catch (error) {
    try {
      fs.rmSync(temporary, { force: true })
    } catch {}
    throw new Error(`Cannot save config at ${path}: ${String(error)}`)
  }
}

export function setConfigValue(
  config: AppConfig,
  key: ConfigKey,
  value: string
): AppConfig {
  if (key === 'default-market') {
    return validateConfig({ ...config, defaultMarket: value })
  }
  const watchInterval = Number(value)
  return validateConfig({ ...config, watchInterval })
}

export function unsetConfigValue(config: AppConfig, key: ConfigKey): AppConfig {
  const next = { ...config }
  if (key === 'default-market') delete next.defaultMarket
  else delete next.watchInterval
  return next
}
