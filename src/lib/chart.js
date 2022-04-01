const asciichart = require('asciichart')
const moment = require('moment')
const { ChartMessage } = require('../message')

class Chart {
  static filterDrawChartDataWithTwoTime(data, date) {
    const startDate = this.getMomentParseZoneDate(date[0])
    const endDate = this.getMomentParseZoneDate(date[1])

    if (startDate.isAfter(endDate)) {
      return ChartMessage.startDateIsAfterEndDate()
    }

    return data.filter((d) => {
      if (Object.keys(d).includes('ts')) {
        const date = moment(this.getHisWithDate(d.ts))

        return startDate.isBefore(date) && endDate.isAfter(date)
      }

      return false
    })
  }

  static getMomentParseZoneDate(date, timezone = 'Asia/Taipei') {
    return moment().set(this.getHisWithDate(date)).parseZone(timezone)
  }

  static getHisWithDate(date) {
    const conversionDate = [0, 2, 4].map((len) => date.substr(len, 2))

    return {
      hour: conversionDate[0],
      minute: conversionDate[1],
      second: conversionDate[2],
    }
  }

  static draw(
    data,
    config = {
      offset: 3,
      height: 10,
      colors: [asciichart.green],
    }
  ) {
    if (data.length > 0) {
      let chart = []

      for (let i = 0; i < data.length; i++) {
        chart.push(parseFloat(data[i].c))
      }

      console.log(asciichart.plot(chart, config))
    } else {
      console.log(ChartMessage.notFoundData())
    }
  }
}

module.exports = Chart
