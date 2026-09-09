import { generateOHLCURL } from '@/commands/stock/url'
import { requestJson } from '@/utils/http'

type OHLCRow = {
  c: string
  ts: string
}

export const getOHLC = (type: string) =>
  requestJson<{ ohlcArray: OHLCRow[] }>(generateOHLCURL(type)).then(
    (data) => data.ohlcArray
  )
