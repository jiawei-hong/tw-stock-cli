const Text = require('../lib/text')

class StockMessage {
  static notInputCode() {
    return Text.red('Please enter code')
  }

  static notFoundStockFile() {
    return Text.red('Please run update command')
  }

  static dateGreaterToday() {
    return Text.red('Query date is greater than today')
  }

  static searchStock(code = '') {
    return Text.green(`Search stock code is: ${code}`)
  }

  static notFoundStockCode(code = '') {
    Text.red(`Not found ${code} stock code.`)
  }

  static notFound() {
    return Text.red(`Not found stock`)
  }
}

module.exports = StockMessage
