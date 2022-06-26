import { colors } from '../color'

class Text {
  static white(text) {
    return `${colors.white}${text}`
  }

  static green(text) {
    return `${colors.green}${text}${colors.white}`
  }

  static red(text) {
    return `${colors.red}${text}${colors.white}`
  }

  static strConvertToDecimalPoint(text, point = 2) {
    return parseFloat(text).toFixed(point).toString()
  }

  static strIsNanHandle(text) {
    return isNaN(text) ? '-' : this.strConvertToDecimalPoint(text)
  }

  static percentageHandle(num) {
    const floatNum = parseFloat(num)
    const percentageString = `${floatNum}%`

    if (floatNum > 0) {
      return this.red(percentageString)
    } else if (floatNum < 0) {
      return this.green(percentageString)
    } else {
      return this.white(percentageString)
    }
  }
}

export default Text
