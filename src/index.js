require('regenerator-runtime/runtime')

const { program } = require('commander')
const Stock = require('./handler/stock')
const Crawler = require('./crawler')

function run() {
  program.name('tw-stock cli').version('0.0.1')

  program
    .command('stock')
    .description('get stock information')
    .argument('<stock_code>', 'stock code')
    .option('-l --listed <listed>', 'this trade is listed?', 'tse')
    .option('-m --multiple', 'search multiple stock', false)
    .action((code, options) => new Stock({ code, options }).initialize())

  program
    .command('update')
    .description('update tse/otc json file')
    .action(() => new Crawler().update())

  program.parse(process.argv)
}

module.exports = { run }
