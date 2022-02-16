require('regenerator-runtime/runtime')

const { program } = require('commander')
const Stock = require('./handler/stock')

function run() {
  program.name('tw-stock cli').version('0.0.1')

  program
    .command('stock')
    .description('get stock information')
    .argument('<stock_code>', 'stock code')
    .option('-l --listed <listed>', 'this trade is listed?', 'tse')
    .action((code, options) => {
      new Stock({ code, options }).getStockCurrentPrice()
    })

  program.parse(process.argv)
}

module.exports = { run }
