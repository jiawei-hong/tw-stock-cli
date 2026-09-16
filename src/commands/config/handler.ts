import {
  AppConfig,
  ConfigKey,
  configPath,
  readConfig,
  setConfigValue,
  unsetConfigValue,
  writeConfig,
} from '@/services/config'
import { displaySuccess } from '@/utils/text'

type ConfigAction = 'list' | 'path' | 'reset' | 'set' | 'unset'

class Config {
  constructor(
    private action: ConfigAction,
    private key?: ConfigKey,
    private value?: string
  ) {}

  initialize(): void {
    if (this.action === 'path') {
      console.log(configPath())
      return
    }
    if (this.action === 'reset') {
      writeConfig({})
      displaySuccess(`Configuration reset at ${configPath()}`)
      return
    }
    const config = readConfig()
    if (this.action === 'list') {
      console.log(JSON.stringify(config, null, 2))
      return
    }
    const updated = this.update(config)
    writeConfig(updated)
    displaySuccess(`Configuration saved to ${configPath()}`)
  }

  private update(config: AppConfig): AppConfig {
    if (!this.key) throw new Error('configuration key is required')
    if (this.action === 'unset') return unsetConfigValue(config, this.key)
    if (this.value === undefined)
      throw new Error('configuration value is required')
    return setConfigValue(config, this.key, this.value)
  }
}

export default Config
