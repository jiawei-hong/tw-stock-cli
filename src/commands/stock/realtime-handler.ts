import { setTimeout as delay } from 'node:timers/promises'

import { FAVORITE_NOT_FOUND } from '@/messages/favorite'
import {
  STOCK_NOT_FOUND,
  STOCK_SEARCH_BUT_NOT_GIVE_CODE,
} from '@/messages/stock'
import { Category, StockOptionProps, TStock } from '@/types/stock'
import FilePath from '@/utils/file'
import { displayFailed, displayWarning } from '@/utils/text'

import { getStock as fetchStockData } from './api'
import Field from './field'
import { renderStockTable } from './render'
import { extractStockData } from './response'
import { getStock } from './url'
import { generateGetStockURL } from './utils'

class RealtimeStock {
  private code: string
  private prefix: string
  private options: StockOptionProps

  constructor(code: string | undefined, options: StockOptionProps) {
    this.code = code ?? ''
    this.prefix = getStock(options.oddLot || false)
    this.options = options
  }

  initialize() {
    if (!this.code && !this.options.favorite) {
      return displayFailed(STOCK_SEARCH_BUT_NOT_GIVE_CODE)
    }
    if (this.options.favorite && !FilePath.favorite.exist()) {
      return displayFailed(FAVORITE_NOT_FOUND)
    }
    const operation = this.options.watch ? this.watch() : this.execute()
    return operation.catch((err) => displayFailed(String(err)))
  }

  async watch(): Promise<void> {
    const intervalMs = (this.options.watch ?? 5) * 1_000
    const query = await generateGetStockURL(this.getStocks())
    if (!query)
      throw new Error('Your favorites list is empty; add a stock first.')
    const controller = new AbortController()
    const stop = () => controller.abort()
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
    try {
      await watchQuotes(
        () => this.execute(query, controller.signal),
        intervalMs,
        {
          signal: controller.signal,
        }
      )
    } finally {
      process.removeListener('SIGINT', stop)
      process.removeListener('SIGTERM', stop)
    }
  }

  getStocks(): { stocks: string | string[]; listed?: Category } {
    if (this.options.multiple) {
      return { stocks: this.code?.split('-') }
    }
    if (this.options.favorite) {
      return { stocks: FilePath.favorite.read().stockCodes }
    }
    return { stocks: this.code, listed: this.options.listed }
  }

  async execute(preparedQuery?: string, signal?: AbortSignal) {
    const query = preparedQuery ?? (await generateGetStockURL(this.getStocks()))
    if (!query) {
      return displayFailed('Your favorites list is empty; add a stock first.')
    }
    const url = `${this.prefix}${query}`

    const response = signal
      ? await fetchStockData(url, signal)
      : await fetchStockData(url)
    if (signal?.aborted) return
    const stocks = extractStockData(response)

    if (typeof stocks === 'string') {
      if (signal) throw new Error(this.getUnavailableMessage(stocks))
      return displayFailed(this.getUnavailableMessage(stocks))
    }

    if (!stocks || stocks.length === 0) {
      if (signal) throw new Error(this.getUnavailableMessage(STOCK_NOT_FOUND))
      return displayFailed(this.getUnavailableMessage(STOCK_NOT_FOUND))
    }

    const fields = Field.basic(this.options)
    renderStockTable(stocks as TStock[], fields)
  }

  private getUnavailableMessage(reason: string): string {
    if (this.options.multiple || this.options.favorite || !this.code) {
      return reason
    }

    const market = this.options.listed
      ? ` on ${this.options.listed.toUpperCase()}`
      : ' on TSE or OTC'
    return `${reason} No current quote matched "${this.code}"${market}. Try tw-stock stock --search ${this.code} to verify the symbol or company name.`
  }
}

type WatchOptions = {
  clear?: () => void
  isTTY?: boolean
  sleep?: (delayMs: number) => Promise<void>
  signal?: AbortSignal
  warn?: (message: string) => void
}

export async function watchQuotes(
  refresh: () => Promise<unknown>,
  intervalMs: number,
  options: WatchOptions = {}
): Promise<void> {
  if (
    !Number.isFinite(intervalMs) ||
    intervalMs < 5_000 ||
    intervalMs > 2_147_483_647
  ) {
    throw new Error('watch interval must be between 5 and 2147483 seconds')
  }
  const clear = options.clear ?? console.clear
  const isTTY = options.isTTY ?? Boolean(process.stdout.isTTY)
  const sleep =
    options.sleep ??
    ((delayMs: number) => delay(delayMs, undefined, { signal: options.signal }))
  const warn = options.warn ?? displayWarning
  let firstRun = true
  let failures = 0

  while (!options.signal?.aborted) {
    if (!firstRun && isTTY) clear()
    try {
      await refresh()
      failures = 0
    } catch (error) {
      if (options.signal?.aborted) return
      failures = Math.min(failures + 1, 6)
      warn(`Quote refresh failed: ${String(error)}; retrying automatically.`)
    }
    firstRun = false
    if (options.signal?.aborted) return
    try {
      await sleep(
        Math.max(intervalMs, Math.min(intervalMs * 2 ** failures, 60_000))
      )
    } catch (error) {
      if (options.signal?.aborted) return
      throw error
    }
  }
}

export default RealtimeStock
