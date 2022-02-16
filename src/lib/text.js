function strConvertToDecimalPoint(text, point = 2) {
  return parseFloat(text).toFixed(point).toString()
}

module.exports = {
  strConvertToDecimalPoint,
}
