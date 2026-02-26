import { program } from 'commander'

import Crawler from './commands/crawler/handler'
import Favorite from './commands/favorite/handler'
import Indices from './commands/index/handler'
import Institutional from './commands/institutional/handler'
import Rank from './commands/rank/handler'
import Stock from './commands/stock/handler'
import completion from './completion'
import { IndexOptionProps } from './types/indices'
import { InstitutionalOptionProps } from './types/institutional'
import { RankOptionProps } from './types/rank'
import { Category, StockOptionProps } from './types/stock'

function run() {
  completion.init()

  program.name('tw-stock').version('2.2.0')

  program
    .command('stock')
    .description('search stock information')
    .argument('[stock_code]', 'stock code')
    .option('-l --listed <listed>', 'market type (tse or otc)', Category.TSE)
    .option('-m --multiple', 'search multiple stocks', false)
    .option('-f --favorite', 'search from favorite list')
    .option('-o --oddLot', 'search odd-lot trading', false)
    .option(
      '-d --date <date>',
      'search historical data (YYYY-MM or YYYY-MM-DD)'
    )
    .option('--details', 'show detailed stock data', true)
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

  program
    .command('crawler')
    .description('update stock list from TWSE/TPEX')
    .action(() => new Crawler().execute())

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

  program.parse(process.argv)
}

run()
