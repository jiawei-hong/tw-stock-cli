const Text = require('../lib/text')

class FavoriteMessage {
  static createFileSuccessfully() {
    return Text.green('Create favorite file successfully')
  }

  static addCodeSuccssfuilly(code) {
    return Text.green(`${code} add successfully`)
  }

  static deleteCodeSuccessfully(code) {
    return Text.green(`${code} delete successfully`)
  }

  static stockCodeIsExistFavorite(code) {
    return Text.red(`${code} is exist in your favorite`)
  }

  static notFoundFavortieFile() {
    return Text.red('Please create favorite file')
  }

  static notFoundStockCodeInFavorite(code) {
    return Text.red(`${code} not exist in favorite`)
  }

  static notFound() {
    return Text.red(`Not found stock in your favorite list`)
  }
}

module.exports = FavoriteMessage
