import { program } from 'commander'

import Crawler from './crawler'
import Favorite from './handler/Favorite'
import Indices from './handler/Indices'
import Stock from './handler/Stock'
import { FavoriteOptionProps } from './types/favorite'
import { IndexOptionProps } from './types/indices'
import { Category, StockOptionProps } from './types/stock'

function run() {
  program.name('tw-stock').version('1.2.12')

  program
    .command('stock')
    .description('get stock information')
    .argument('[stock_code]', 'stock code')
    .option('-l --listed <listed>', 'this trade is listed?', Category.TSE)
    .option('-m --multiple', 'search multiple stock', false)
    .option('-f --favorite')
    .option('-o --oddLot', 'search odd-lot', false)
    .option('-d --date <date>', 'search stock history')
    .action((code: string, options: StockOptionProps) =>
      new Stock(code, options).initialize()
    )

  program
    .command('index')
    .description('get tw-stock index')
    .argument('[code]', 'get tw-stock index', 'TAIEX')
    .option('-m --multiple', 'search multiple index', false)
    .option('-t --time <time...>', 'only use on 9:00AM to 13:30PM')
    .option('-c --chart', 'draw index chart', false)
    .action((code: string, options: IndexOptionProps) =>
      new Indices(code, options).initialize()
    )

  program
    .command('crawler')
    .description('crawler tse/otc json file')
    .action(() => new Crawler().execute())

  program
    .command('favorite')
    .description('check yourself favorite stocks')
    .argument('[code]', 'add or delete stockCode')
    .option('-c --create', 'create favorite file')
    .option('-a --add', 'add stockCode in favorite list')
    .option('-d --delete', 'delete stockCode from favorite list')
    .action((code: string | undefined, options: FavoriteOptionProps) =>
      new Favorite({ code, options }).initialize()
    )

  program.parse(process.argv)
}

export { run }
