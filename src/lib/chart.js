const asciichart = require('asciichart')
const { ChartMessage } = require('../message/chart')

class Chart {
  static draw(
    data,
    config = {
      showDatacount: 190,
    },
    chartConfig = {
      offset: 3,
      height: 30,
      colors: [asciichart.green],
    }
  ) {
    if (data.length > 0) {
      let chart = [parseFloat(data[0].c)]

      for (let i = 1; i < data.length; i++) {
        if (i < config.showDatacount) {
          chart.push(parseFloat(data[i].c))
        }
      }

      console.log(asciichart.plot(chart, chartConfig))
    } else {
      console.log(ChartMessage.notFoundData())
    }
  }
}

module.exports = Chart
