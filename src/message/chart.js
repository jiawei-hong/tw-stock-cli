const Text = require('../lib/text')

class ChartMessage {
  static notFoundData() {
    return Text.red('No data yet')
  }

  static notFound() {
    return Text.red(`Not found stock`)
  }
}

module.exports = ChartMessage
