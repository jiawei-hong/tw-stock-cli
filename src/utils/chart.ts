import * as asciichart from 'asciichart'
import { isAfter, isBefore, set } from 'date-fns'

import {
  CHART_NOT_FOUND,
  CHART_START_DATE_IS_AFTER_END_DATE,
} from '@/messages/chart'

import { displayFailed } from './text'

function getHisWithDate(date: string): Date {
  const [hour, minute] = [0, 2].map((len) => parseInt(date.substr(len, 2)))

  return set(new Date(), {
    hours: hour,
    minutes: minute + 480, // 480 = 8 hours
    seconds: 0,
    milliseconds: 0,
  })
}

function filterDrawChartDataWithTwoTime(data: any, date: any) {
  const startDate = getHisWithDate(date[0])
  const endDate = getHisWithDate(date[1])

  if (isAfter(startDate, endDate)) {
    return displayFailed(CHART_START_DATE_IS_AFTER_END_DATE)
  }

  return data.filter((d: any) => {
    if (Object.keys(d).includes('ts')) {
      const date = getHisWithDate(d.ts)
      return isBefore(startDate, date) && isAfter(endDate, date)
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

export { draw, filterDrawChartDataWithTwoTime }
