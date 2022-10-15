import axios from 'axios'

import { generateOHLCURL } from '../url'

export const getOHLC = (type: string) =>
  axios.get(generateOHLCURL(type)).then((res) => res.data.ohlcArray)
