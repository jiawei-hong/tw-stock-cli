import { InvalidArgumentError, program } from 'commander'

import FilePath from '@/utils/file'

import packageJson from '../package.json'
import ConfigCommand from './commands/config/handler'
import Events from './commands/events/handler'
import Favorite from './commands/favorite/handler'
import Fundamentals from './commands/fundamentals/handler'
import Indices from './commands/index/handler'
import Institutional from './commands/institutional/handler'
import Overview from './commands/overview/handler'
import Rank from './commands/rank/handler'
import Screen, { ScreenOptions } from './commands/screen/handler'
import Stock from './commands/stock/handler'
import completion from './completion'
import { AppConfig, ConfigKey, readConfig } from './services/config'
import { IndexOptionProps } from './types/indices'
import { InstitutionalOptionProps } from './types/institutional'
import { RankOptionProps } from './types/rank'
import { Category, StockOptionProps } from './types/stock'
import { displayFailed, enableFailureExitCode } from './utils/text'

function run() {
  enableFailureExitCode()
  completion.init()
  let config: AppConfig
  try {
    config = readConfig()
  } catch (error) {
    const recoveryAction =
      process.argv[2] === 'config' &&
      ['path', 'reset'].includes(process.argv[3] ?? '')
    if (!recoveryAction) {
      displayFailed(String(error))
      return
    }
    config = {}
  }

  program.name('tw-stock').version(packageJson.version)

  program
    .command('stock')
    .description('show realtime or historical stock information')
    .argument('[stock_code]', 'stock code (for example, 2330)')
    .option('-l, --listed <listed>', 'market override (tse or otc)')
    .option('-m --multiple', 'search multiple stocks', false)
    .option('-f --favorite', 'search from favorite list')
    .option('-o, --odd-lot', 'search odd-lot trading', false)
    .option('--oddLot', 'legacy alias for --odd-lot', false)
    .option(
      '-s, --search <code-or-name>',
      'find stocks by code or company name'
    )
    .option(
      '-d --date <date>',
      'search historical data (YYYY-MM or YYYY-MM-DD)'
    )
    .option('--chart', 'draw historical daily closing prices')
    .option('--range <range>', 'chart range: 1m (default), 3m, 6m, or 1y')
    .option('--details', 'show detailed stock data', true)
    .option(
      '-w, --watch [seconds]',
      'refresh quotes; defaults to configured interval or 5 seconds',
      parseWatchInterval
    )
    .action((code: string, options: RawStockOptions) =>
      new Stock(code, resolveStockOptions(options, config)).initialize()
    )

  program
    .command('overview')
    .description(
      'show a stock overview with quotes, fundamentals, institutional data, and events'
    )
    .argument('<stock_code>', 'stock code')
    .option(
      '-l, --listed <market>',
      'market (tse or otc)',
      parseMarket,
      config.defaultMarket ?? Category.TSE
    )
    .action((code: string, options: { listed: Category }) =>
      new Overview(code, options.listed).initialize()
    )

  program
    .command('index')
    .description('search market index (TAIEX, TWO, FRMSA)')
    .argument('[code]', 'index code', 'TAIEX')
    .option('-m --multiple', 'search multiple indices', false)
    .option('-t --time <time...>', 'time range (HHMM format, 0900-1330)')
    .option('-c --chart', 'display ASCII chart', false)
    .action((code: string, options: IndexOptionProps) =>
      new Indices(code, options).initialize()
    )

  program
    .command('institutional')
    .description(
      'search institutional investors buy/sell data (三大法人買賣超)'
    )
    .argument('[stock_code]', 'stock code')
    .option(
      '-l --listed <listed>',
      'market type (tse or otc)',
      parseMarket,
      config.defaultMarket ?? Category.TSE
    )
    .option('-d --date <date>', 'search specific date (YYYY-MM-DD)')
    .option('-n --number <number>', 'number of results to show', parseInt)
    .action((code: string, options: InstitutionalOptionProps) =>
      new Institutional(code, options).initialize()
    )

  program
    .command('rank')
    .description('show daily stock ranking (當日漲跌幅排行)')
    .option(
      '-l --listed <listed>',
      'market type (tse or otc)',
      parseMarket,
      config.defaultMarket ?? Category.TSE
    )
    .option('-d --date <date>', 'search specific date (YYYY-MM-DD)')
    .option('-n --number <number>', 'number of results to show', parseInt)
    .option('--losers', 'show top losers instead of gainers', false)
    .option('--volume', 'sort by volume', false)
    .action((options: RankOptionProps) => new Rank(options).initialize())

  program
    .command('screen')
    .description(
      'filter daily closing prices by price, volume in shares, and change percent'
    )
    .option(
      '-l, --listed <market>',
      'market (tse or otc)',
      parseMarket,
      config.defaultMarket ?? Category.TSE
    )
    .option(
      '-d, --date <date>',
      'report date (YYYY-MM-DD); defaults to latest available'
    )
    .option(
      '--min-price <value>',
      'minimum closing price (inclusive)',
      parseScreenNumber
    )
    .option(
      '--max-price <value>',
      'maximum closing price (inclusive)',
      parseScreenNumber
    )
    .option(
      '--min-volume <shares>',
      'minimum volume in shares (inclusive)',
      parseScreenNumber
    )
    .option(
      '--max-volume <shares>',
      'maximum volume in shares (inclusive)',
      parseScreenNumber
    )
    .option(
      '--min-change <percent>',
      'minimum price change percent (inclusive)',
      parseScreenNumber
    )
    .option(
      '--max-change <percent>',
      'maximum price change percent (inclusive)',
      parseScreenNumber
    )
    .option(
      '--sort <field>',
      'descending sort: volume, change, or price',
      'volume'
    )
    .option(
      '-n, --number <count>',
      'maximum number of results',
      parseScreenNumber,
      20
    )
    .action((options: ScreenOptions) => new Screen(options).initialize())

  const favorite = program
    .command('favorite')
    .description('manage favorite stocks')
    .action(() => new Favorite('list').initialize())

  favorite
    .command('path')
    .description('show the saved favorites path')
    .action(() => console.log(FilePath.favorite.path()))

  favorite
    .command('import [file]')
    .description('merge a legacy favorite.json into saved favorites')
    .action((file?: string) => new Favorite('import', file).initialize())

  favorite
    .command('create')
    .description('create favorite file')
    .action(() => new Favorite('create').initialize())

  favorite
    .command('add')
    .description('add stock code to favorite list')
    .argument('<code>', 'stock code')
    .action((code: string) => new Favorite('add', code).initialize())

  favorite
    .command('delete')
    .description('delete stock code from favorite list')
    .argument('<code>', 'stock code')
    .action((code: string) => new Favorite('delete', code).initialize())

  favorite
    .command('list', { isDefault: true })
    .description('list favorite stocks')
    .action(() => new Favorite('list').initialize())

  program
    .command('completion')
    .description('setup shell tab-completion')
    .option('--cleanup', 'remove completion from shell profile')
    .action((options: { cleanup?: boolean }) => {
      if (options.cleanup) {
        completion.cleanupShellInitFile()
      } else {
        completion.setupShellInitFile()
      }
    })

  program
    .command('events')
    .description('show market calendar, dividends, and trading announcements')
    .argument('[stock_code]', 'optional stock code')
    .option('-m, --month <month>', 'filter by month (YYYY-MM)')
    .option(
      '-l, --listed <market>',
      'market (tse or otc)',
      parseMarket,
      config.defaultMarket ?? Category.TSE
    )
    .action(
      (
        code: string | undefined,
        options: { month?: string; listed: Category }
      ) => new Events(code, options.month, options.listed).initialize()
    )

  program
    .command('fundamentals')
    .description('show valuation, revenue, and cumulative EPS data')
    .argument('<stock_code>', 'stock code')
    .option(
      '-l, --listed <market>',
      'market (tse or otc)',
      parseMarket,
      config.defaultMarket ?? Category.TSE
    )
    .action((code: string, options: { listed: Category }) =>
      new Fundamentals(code, options.listed).initialize()
    )

  const configCommand = program
    .command('config')
    .description('manage persistent CLI defaults')
    .action(() => new ConfigCommand('list').initialize())

  configCommand
    .command('list')
    .description('show saved configuration')
    .action(() => new ConfigCommand('list').initialize())

  configCommand
    .command('path')
    .description('show the configuration file path')
    .action(() => new ConfigCommand('path').initialize())

  configCommand
    .command('reset')
    .description('replace invalid or saved configuration with empty defaults')
    .action(() => new ConfigCommand('reset').initialize())

  configCommand
    .command('set')
    .description('set a configuration value')
    .argument('<key>', 'default-market or watch-interval')
    .argument('<value>', 'value to save')
    .action((key: string, value: string) =>
      new ConfigCommand('set', parseConfigKey(key), value).initialize()
    )

  configCommand
    .command('unset')
    .description('remove a configuration value')
    .argument('<key>', 'default-market or watch-interval')
    .action((key: string) =>
      new ConfigCommand('unset', parseConfigKey(key)).initialize()
    )

  program
    .parseAsync(process.argv)
    .catch((error) => displayFailed(String(error)))
}

function parseScreenNumber(value: string): number {
  if (
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ||
    !Number.isFinite(Number(value))
  ) {
    throw new InvalidArgumentError('expected a finite decimal number')
  }
  return Number(value)
}

function parseWatchInterval(value: string): number {
  const seconds = Number(value)
  if (!Number.isFinite(seconds) || seconds < 5 || seconds > 2_147_483) {
    throw new InvalidArgumentError('watch interval must be at least 5 seconds')
  }
  return seconds
}

type RawStockOptions = Omit<StockOptionProps, 'watch'> & {
  watch?: boolean | number
}

function resolveStockOptions(
  options: RawStockOptions,
  config: AppConfig
): StockOptionProps {
  return {
    ...options,
    listed: options.listed ?? config.defaultMarket,
    watch:
      options.watch === true
        ? config.watchInterval ?? 5
        : options.watch || undefined,
  }
}

function parseMarket(value: string): Category {
  if (value !== Category.TSE && value !== Category.OTC) {
    throw new InvalidArgumentError('market must be tse or otc')
  }
  return value
}

function parseConfigKey(value: string): ConfigKey {
  if (value !== 'default-market' && value !== 'watch-interval') {
    throw new InvalidArgumentError(
      'configuration key must be default-market or watch-interval'
    )
  }
  return value
}

run()
