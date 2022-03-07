require('regenerator-runtime/runtime')

const { program } = require('commander')
const Stock = require('./handler/stock')
const Crawler = require('./crawler')
const Favorite = require('./handler/favroite')

function run() {
  program.name('tw-stock cli').version('0.0.1')

  program
    .command('stock')
    .description('get stock information')
    .argument('[stock_code]', 'stock code')
    .option('-l --listed <listed>', 'this trade is listed?', 'tse')
    .option('-m --multiple', 'search multiple stock', false)
    .option('-f --favorite')
    .action((code, options) => new Stock({ code, options }).initialize())

  program
    .command('update')
    .description('update tse/otc json file')
    .action(() => new Crawler().update())

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
