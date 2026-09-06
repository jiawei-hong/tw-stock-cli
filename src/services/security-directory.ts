import { Category, StockPayload } from '@/types/stock'

const TDCC_SECURITIES_URL = 'https://openapi.tdcc.com.tw/v1/opendata/1-1'
const TDCC_TIMEOUT_MS = 30_000

type SecurityStatus = 'active' | 'suspended' | 'terminated' | 'unknown'

export type Security = {
  code: string
  name: string
  category: Category
  status: SecurityStatus
}

type TdccRecord = Record<string, unknown>

let directoryRequest: Promise<StockPayload> | undefined

function getString(record: TdccRecord, key: string): string {
  const value = record[key] ?? record[`\ufeff${key}`]
  return typeof value === 'string' ? value.trim() : ''
}

export function classifySecurityStatus(status: string): SecurityStatus {
  if (status === '正常') return 'active'
  if (status.includes('暫停交易')) return 'suspended'
  if (status.includes('下市櫃') || status.includes('停止帳簿劃撥')) {
    return 'terminated'
  }
  return 'unknown'
}

export function parseSecurityDirectory(data: unknown): StockPayload {
  if (!Array.isArray(data)) {
    throw new Error('TDCC security directory response must be an array')
  }

  const securities = data.reduce<StockPayload>((directory, value) => {
    if (!value || typeof value !== 'object') return directory

    const record = value as TdccRecord
    const market = getString(record, '市場別')
    const category =
      market === '上市'
        ? Category.TSE
        : market === '上櫃'
        ? Category.OTC
        : undefined
    const code = getString(record, '證券代號').toUpperCase()
    const name = getString(record, '證券名稱')
    const status = classifySecurityStatus(getString(record, '證券狀態'))

    if (category && code && name && status === 'active') {
      directory[code] = { name, category }
    }
    return directory
  }, {})

  if (Object.keys(securities).length === 0) {
    throw new Error('TDCC security directory contains no active listed stocks')
  }

  return securities
}

async function requestSecurityDirectory(): Promise<StockPayload> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TDCC_TIMEOUT_MS)

  try {
    const response = await fetch(TDCC_SECURITIES_URL, {
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(
        `TDCC security directory request failed (${response.status})`
      )
    }
    return parseSecurityDirectory(await response.json())
  } finally {
    clearTimeout(timeout)
  }
}

export function getSecurityDirectory(): Promise<StockPayload> {
  directoryRequest ??= requestSecurityDirectory().catch((error) => {
    directoryRequest = undefined
    throw error
  })
  return directoryRequest
}

export function resetSecurityDirectoryCache(): void {
  directoryRequest = undefined
}

export { TDCC_SECURITIES_URL }
