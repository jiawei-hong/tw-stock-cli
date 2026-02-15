import { program } from 'commander'

import Crawler from './crawler'
import Favorite from './handler/Favorite'
import Indices from './handler/Indices'
import Stock from './handler/Stock'
import { IndexOptionProps } from './types/indices'
import { Category, StockOptionProps } from './types/stock'

function run() {
  program.name('tw-stock').version('1.3.1')

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

  program.parse(process.argv)
}

run()
