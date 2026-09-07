import { getStock } from '@/commands/stock/url'
import { generateGetStockURL } from '@/commands/stock/utils'
import { StockPayload } from '@/types/stock'

export async function getMarketSymbols(codes: string[]): Promise<StockPayload> {
  const symbols = [...new Set(codes.map((code) => code.toUpperCase()))]
  const result: StockPayload = {}
  for (let offset = 0; offset < symbols.length; offset += 50) {
    const batch = symbols.slice(offset, offset + 50)
    const query = await generateGetStockURL({ stocks: batch })
    const response = await fetch(`${getStock(false)}${query}`, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`MIS request failed (${response.status})`)
    const payload = await response.json()
    if (payload.rtcode !== '0000' || !Array.isArray(payload.msgArray)) {
      throw new Error('MIS returned an invalid symbol response')
    }
    for (const row of payload.msgArray) {
      if (
        row &&
        batch.includes(row.c) &&
        ['tse', 'otc'].includes(row.ex) &&
        typeof row.n === 'string' &&
        row.n.trim()
      ) {
        result[row.c] = { name: row.n.trim(), category: row.ex }
      }
    }
  }
  return result
}
