const Text = require('../lib/text')

class StockIndexMessage {
  static useDateOptionsButNotGiveTwoTime() {
    return Text.red('You use date options but not give startDate and endDate')
  }

  static notFoundIndex(index) {
    return Text.red(`Not found ${index} Index`)
  }
}

module.exports = StockIndexMessage
