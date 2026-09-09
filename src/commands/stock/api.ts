import { StockResponse, TStock } from '@/types/stock'
import { requestJson } from '@/utils/http'
import { displayWarning } from '@/utils/text'

function matchesTicker(row: TStock, ticker: string): boolean {
  const match = /^(tse|otc)_(.+)\.tw$/i.exec(ticker)
  return Boolean(
    match &&
      typeof row.c === 'string' &&
      typeof row.ex === 'string' &&
      row.ex.toLowerCase() === match[1].toLowerCase() &&
      (row.c.toLowerCase() === match[2].toLowerCase() ||
        (typeof row.ch === 'string' &&
          row.ch.toLowerCase() === `${match[2].toLowerCase()}.tw`))
  )
}

async function getStock(url: string): Promise<StockResponse> {
  const parsed = new URL(url)
  const query = parsed.searchParams.get('ex_ch')
  if (query === null) return requestJson<StockResponse>(url)
  if (!query.trim()) {
    return {
      stat: 'OK',
      rtcode: '0000',
      msgArray: [],
    } as unknown as StockResponse
  }
  const tickers = [...new Set(query.split('|').filter(Boolean))]
  const rows: TStock[] = []
  const problems: string[] = []
  for (let offset = 0; offset < tickers.length; offset += 100) {
    const batch = tickers.slice(offset, offset + 100)
    const batchUrl = new URL(url)
    batchUrl.searchParams.set('ex_ch', batch.join('|'))
    try {
      const data = await requestJson<StockResponse>(
        tickers.length <= 100 ? url : batchUrl.toString()
      )
      if (!('msgArray' in data) || !Array.isArray(data.msgArray))
        throw new Error('Invalid MIS quote response')
      for (const row of data.msgArray) {
        const matched = row?.c
          ? batch.filter((ticker) => matchesTicker(row, ticker))
          : []
        if (matched.length) {
          rows.push(row)
        }
      }
    } catch (error) {
      problems.push(`${batch.join(', ')}: ${String(error)}`)
    }
  }
  const ordered = tickers.flatMap((ticker) =>
    rows.filter((row) => matchesTicker(row, ticker))
  )
  const unique = ordered.filter(
    (row, index) =>
      ordered.findIndex((entry) => entry.c === row.c && entry.ex === row.ex) ===
      index
  )
  const matchedCodes = new Set(unique.map((row) => row.c.toUpperCase()))
  const unresolved = [
    ...new Set(
      tickers
        .map((ticker) =>
          ticker.replace(/^(tse|otc)_/i, '').replace(/\.tw$/i, '')
        )
        .filter((code) => !matchedCodes.has(code.toUpperCase()))
    ),
  ]
  if (problems.length && !unique.length) throw new Error(problems.join('; '))
  if (problems.length)
    displayWarning(`Some quote requests failed: ${problems.join('; ')}`)
  if (unresolved.length)
    displayWarning(`Unresolved symbols: ${unresolved.join(', ')}`)
  return { stat: 'OK', rtcode: '0000', msgArray: unique } as StockResponse
}

export { getStock }
