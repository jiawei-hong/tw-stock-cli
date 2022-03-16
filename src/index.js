require('regenerator-runtime/runtime')

const { program } = require('commander')
const Stock = require('./handler/stock')
const StockIndex = require('./handler/stockIndex')
const Crawler = require('./crawler')
const Favorite = require('./handler/favroite')

function run() {
  program.name('tw-stock').version('1.1.6')

  program
    .command('stock')
    .description('get stock information')
    .argument('[stock_code]', 'stock code')
    .option('-l --listed <listed>', 'this trade is listed?', 'tse')
    .option('-m --multiple', 'search multiple stock', false)
    .option('-f --favorite')
    .action((code, options) => new Stock({ code, options }).execute())

  program
    .command('index')
    .description('get tw-stock index')
    .argument('[index]', 'get tw-stock index', 'TAIEX')
    .option('-m --multiple', 'search multiple index', false)
    .action((index, options) => new StockIndex({ index, options }).execute())

  program
    .command('update')
    .description('update tse/otc json file')
    .action(() => new Crawler().execute())

  program
    .command('favorite')
    .description('check yourself favorite stocks')
    .option('-c --create', 'create favorite file')
    .option('-a --add <stockCode>', 'add stockCode in favorite list')
    .option('-d --delete <stockCode>', 'delete stockCode from favorite list')
    .action((options) => new Favorite({ options }).execute())

  program.parse(process.argv)
}

module.exports = { run }
