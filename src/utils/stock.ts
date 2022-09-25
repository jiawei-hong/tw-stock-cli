function getConversionDate(date: string, category = 'tse') {
  const dateRegex = {
    day: /(\d{4})(\d{2})(\d{2})/g,
    month: /(\d{4})(\d{2})/g,
  }
  let data = Object.keys(dateRegex)
    .map((key) => [...date.matchAll(dateRegex[key as keyof typeof dateRegex])])
    .find((d) => d.length > 0)

  if (data && category == 'otc') {
    data[0][1] = (parseInt(data[0][1]) - 1911).toString()
  }

  return !data ? 'Invalid Date' : data[0].splice(1, data[0].length - 1)
}

function getTaiwanDateFormat(date: string[], separator = '/') {
  date[0] = (parseInt(date[0]) - 1911).toString()
  return date.join(separator)
}

export { getConversionDate, getTaiwanDateFormat }
