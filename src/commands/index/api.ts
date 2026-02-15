import { generateOHLCURL } from '@/commands/stock/url'

export const getOHLC = (type: string) =>
  fetch(generateOHLCURL(type))
    .then((res) => res.json())
    .then((data) => data.ohlcArray)
