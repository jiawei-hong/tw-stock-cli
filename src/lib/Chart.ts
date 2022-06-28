import * as asciichart from 'asciichart'
import * as moment from 'moment'
import {
  CHART_NOT_FOUND,
  CHART_START_DATE_IS_AFTER_END_DATE,
} from '../message/Chart'
import { displayFailed } from './Text'

function getHisWithDate(date: string): moment.Moment {
  const [hour, minute, seconds] = [0, 2, 4].map((len) =>
    parseInt(date.substr(len, 2))
  )

  return moment()
    .set({
      hour,
      minute,
      seconds,
    })
    .utcOffset(8)
}

function filterDrawChartDataWithTwoTime(data: any, date: any) {
  const startDate = getHisWithDate(date[0])
  const endDate = getHisWithDate(date[1])

  if (startDate.isAfter(endDate)) {
    return displayFailed(CHART_START_DATE_IS_AFTER_END_DATE)
  }

  return data.filter((d: any) => {
    if (Object.keys(d).includes('ts')) {
      const date = getHisWithDate(d.ts)
      return startDate.isBefore(date) && endDate.isAfter(date)
    }
    return false
  })
}

function draw(
  data: any,
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
    displayFailed(CHART_NOT_FOUND)
  }
}

export { filterDrawChartDataWithTwoTime, draw }
