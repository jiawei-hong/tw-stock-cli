const Text = require('./text')

function getStockUpsAndDownsPercentage(stock) {
  let [yesterdayPrice, currentPrice] = [stock.y, stock.z]

  const percenetage = Text.strIsNanHandle(
    ((parseFloat(currentPrice) - parseFloat(yesterdayPrice)) / yesterdayPrice) *
      100
  )

  return isNaN(percenetage) ? '-' : Text.percentageHandle(percenetage)
}

function category2Chinese(category) {
  const categories = ['tse', 'otc']
  const categoryLowerCase = category.toLowerCase()

  if (!categories.includes(categoryLowerCase)) {
    return Text.red(`${category} not found chinese word.`)
  }

  return categoryLowerCase == 'tse' ? '上市' : '上櫃'
}

export { getStockUpsAndDownsPercentage, category2Chinese }
