require('regenerator-runtime/runtime')

const { program } = require('commander')
const Stock = require('./handler/stock')
const StockIndex = require('./handler/stockIndex')
const Crawler = require('./crawler')
const Favorite = require('./handler/favorite')

function run() {
  program.name('tw-stock').version('1.2.3')

  program
    .command('stock')
    .description('get stock information')
    .argument('[stock_code]', 'stock code')
    .option('-l --listed <listed>', 'this trade is listed?', 'tse')
    .option('-m --multiple', 'search multiple stock', false)
    .option('-f --favorite')
    .option('-o --oddlot', 'search odd-lot', false)
    .option('-d --date <date>', 'search stock history')
    .action((code, options) => new Stock({ code, options }).execute())

  program
    .command('index')
    .description('get tw-stock index')
    .argument('[code]', 'get tw-stock index', 'TAIEX')
    .option('-m --multiple', 'search multiple index', false)
    .option('-d --date <date...>', 'only use on 9:00AM to 13:30PM')
    .option('-c --chart', 'draw index chart', false)
    .action((code, options) => new StockIndex({ code, options }).execute())

  program
    .command('update')
    .description('update tse/otc json file')
    .action(() => new Crawler().execute())

  program
    .command('favorite')
    .description('check yourself favorite stocks')
    .argument('[code]', 'add or delete stockCode')
    .option('-c --create', 'create favorite file')
    .option('-a --add', 'add stockCode in favorite list')
    .option('-d --delete', 'delete stockCode from favorite list')
    .action((code, options) => new Favorite({ code, options }).execute())

  program.parse(process.argv)
}

module.exports = { run }
