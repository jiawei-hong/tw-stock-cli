import { program } from 'commander'

import Stock from './handler/stock'
import StockIndex from './handler/stockIndex'
import Favorite from './handler/favorite'
import Crawler from './crawler'

type StockOptionProps = {
  listed?: string
  multiple?: boolean
  favorite?: boolean
  oddLot?: boolean
  date?: string
}

type IndexOptionProps = {
  multiple?: boolean
  date?: string
  chart: boolean
}

type FavoriteOptionProps = {
  create?: boolean
  add?: boolean
  delete?: boolean
}

function run() {
  program.name('tw-stock').version('1.2.4')

  program
    .command('stock')
    .description('get stock information')
    .argument('[stock_code]', 'stock code')
    .option('-l --listed <listed>', 'this trade is listed?', 'tse')
    .option('-m --multiple', 'search multiple stock', false)
    .option('-f --favorite')
    .option('-o --oddLot', 'search odd-lot', false)
    .option('-d --date <date>', 'search stock history')
    .action((code: string | undefined, options: StockOptionProps) =>
      new Stock({ code, options }).execute()
    )

  program
    .command('index')
    .description('get tw-stock index')
    .argument('[code]', 'get tw-stock index', 'TAIEX')
    .option('-m --multiple', 'search multiple index', false)
    .option('-d --date <date...>', 'only use on 9:00AM to 13:30PM')
    .option('-c --chart', 'draw index chart', false)
    .action((code: string | undefined, options: IndexOptionProps) =>
      new StockIndex({ code, options }).execute()
    )

  program
    .command('update')
    .description('update tse/otc json file')
    .action(() => new Crawler().execute())

    // program
    .command('favorite')
    .description('check yourself favorite stocks')
    .argument('[code]', 'add or delete stockCode')
    .option('-c --create', 'create favorite file')
    .option('-a --add', 'add stockCode in favorite list')
    .option('-d --delete', 'delete stockCode from favorite list')
    .action((code: string | undefined, options: FavoriteOptionProps) =>
      new Favorite({ code, options }).execute()
    )

  program.parse(process.argv)
}

export { run }
