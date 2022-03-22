const Text = require('./text')

function getStockUpsAndDownsPercentage(stock) {
  let [yesterdayPrice, currentPrice] = [stock.y, stock.z]

  const percenetage = Text.strIsNanHandle(
    ((parseFloat(currentPrice) - parseFloat(yesterdayPrice)) / yesterdayPrice) *
      100
  )

  return isNaN(percenetage) ? '-' : Text.percentageHandle(percenetage)
}

export { getStockUpsAndDownsPercentage }
