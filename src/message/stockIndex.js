const Text = require('../lib/text')

class StockIndexMessage {
  static notFoundIndex(index) {
    return Text.red(`Not found ${index} Index`)
  }
}

module.exports = StockIndexMessage
