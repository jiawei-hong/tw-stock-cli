import { InvalidArgumentError, program } from 'commander'

import packageJson from '../package.json'
import Events from './commands/events/handler'
import Favorite from './commands/favorite/handler'
import Fundamentals from './commands/fundamentals/handler'
import Indices from './commands/index/handler'
import Institutional from './commands/institutional/handler'
import Rank from './commands/rank/handler'
import Stock from './commands/stock/handler'
import completion from './completion'
import { IndexOptionProps } from './types/indices'
import { InstitutionalOptionProps } from './types/institutional'
import { RankOptionProps } from './types/rank'
import { Category, StockOptionProps } from './types/stock'
import { displayFailed, enableFailureExitCode } from './utils/text'

function run() {
  enableFailureExitCode()
  completion.init()

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
    .option('--details', 'show detailed stock data', true)
    .option(
      '-w, --watch <seconds>',
      'refresh realtime quotes every 5 seconds or more',
      parseWatchInterval
    )
    .action((code: string, options: StockOptionProps) =>
      new Stock(code, options).initialize()
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
    .option('-l --listed <listed>', 'market type (tse or otc)', Category.TSE)
    .option('-d --date <date>', 'search specific date (YYYY-MM-DD)')
    .option('-n --number <number>', 'number of results to show', parseInt)
    .action((code: string, options: InstitutionalOptionProps) =>
      new Institutional(code, options).initialize()
    )

  program
    .command('rank')
    .description('show daily stock ranking (當日漲跌幅排行)')
    .option('-l --listed <listed>', 'market type (tse or otc)', Category.TSE)
    .option('-d --date <date>', 'search specific date (YYYY-MM-DD)')
    .option('-n --number <number>', 'number of results to show', parseInt)
    .option('--losers', 'show top losers instead of gainers', false)
    .option('--volume', 'sort by volume', false)
    .action((options: RankOptionProps) => new Rank(options).initialize())

  const favorite = program
    .command('favorite')
    .description('manage favorite stocks')
    .action(() => new Favorite('list').initialize())

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
      Category.TSE
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
      Category.TSE
    )
    .action((code: string, options: { listed: Category }) =>
      new Fundamentals(code, options.listed).initialize()
    )

  program
    .parseAsync(process.argv)
    .catch((error) => displayFailed(String(error)))
}

function parseWatchInterval(value: string): number {
  const seconds = Number(value)
  if (!Number.isFinite(seconds) || seconds < 5 || seconds > 2_147_483) {
    throw new InvalidArgumentError('watch interval must be at least 5 seconds')
  }
  return seconds
}

function parseMarket(value: string): Category {
  if (value !== Category.TSE && value !== Category.OTC) {
    throw new InvalidArgumentError('market must be tse or otc')
  }
  return value
}

run()
