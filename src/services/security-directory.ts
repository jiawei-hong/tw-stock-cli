import { Category, StockPayload } from '@/types/stock'
import type { RequestJsonOptions } from '@/utils/http'
import { requestJson } from '@/utils/http'

const TDCC_SECURITIES_URL = 'https://openapi.tdcc.com.tw/v1/opendata/1-1'
const TDCC_TIMEOUT_MS = 30_000
const SECURITY_DIRECTORY_CACHE_TTL_MS = 5 * 60_000

type SecurityStatus = 'active' | 'suspended' | 'terminated' | 'unknown'

export type Security = {
  code: string
  name: string
  category: Category
  status: SecurityStatus
}

type TdccRecord = Record<string, unknown>

let directoryRequest: Promise<Security[]> | undefined
let directoryExpiresAt = 0

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

export function parseSecurityRecords(data: unknown): Security[] {
  if (!Array.isArray(data)) {
    throw new Error('TDCC security directory response must be an array')
  }

  const securities = data.reduce<Security[]>((directory, value) => {
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
      directory.push({ code, name, category, status })
    }
    return directory
  }, [])

  if (securities.length === 0) {
    throw new Error('TDCC security directory contains no active listed stocks')
  }

  return securities
}

export function parseSecurityDirectory(data: unknown): StockPayload {
  return parseSecurityRecords(data).reduce<StockPayload>(
    (directory, security) => {
      const current = directory[security.code]
      if (!current || security.category === Category.TSE) {
        directory[security.code] = {
          name: security.name,
          category: security.category,
        }
      }
      return directory
    },
    {}
  )
}

async function requestSecurityDirectory(
  options?: RequestJsonOptions
): Promise<Security[]> {
  const data = await requestJson<unknown>(TDCC_SECURITIES_URL, {
    ...options,
    timeoutMs: TDCC_TIMEOUT_MS,
  })
  return parseSecurityRecords(data)
}

export function getSecurityDirectory(
  options?: RequestJsonOptions
): Promise<StockPayload> {
  return getSecurityRecords(options).then((securities) =>
    securities.reduce<StockPayload>((directory, security) => {
      const current = directory[security.code]
      if (!current || security.category === Category.TSE) {
        directory[security.code] = {
          name: security.name,
          category: security.category,
        }
      }
      return directory
    }, {})
  )
}

export function getSecurityRecords(
  options?: RequestJsonOptions
): Promise<Security[]> {
  const cacheExpired =
    directoryExpiresAt > 0 && Date.now() >= directoryExpiresAt
  if (!directoryRequest || cacheExpired) {
    directoryExpiresAt = 0
    directoryRequest = requestSecurityDirectory(options)
      .then((securities) => {
        directoryExpiresAt = Date.now() + SECURITY_DIRECTORY_CACHE_TTL_MS
        return securities
      })
      .catch((error) => {
        directoryRequest = undefined
        throw error
      })
  }
  return directoryRequest
}

export async function searchSecurityDirectory(
  query: string,
  category?: Category
): Promise<Security[]> {
  const normalizedQuery = query.trim().toLocaleUpperCase()
  if (!normalizedQuery) return []

  const matches = (await getSecurityRecords()).filter((security) => {
    if (category && security.category !== category) return false
    const code = security.code.toLocaleUpperCase()
    const name = security.name.toLocaleUpperCase()
    return code.includes(normalizedQuery) || name.includes(normalizedQuery)
  })

  const rank = (security: Security): number => {
    const code = security.code.toLocaleUpperCase()
    const name = security.name.toLocaleUpperCase()
    if (code === normalizedQuery || name === normalizedQuery) return 0
    if (code.startsWith(normalizedQuery) || name.startsWith(normalizedQuery)) {
      return 1
    }
    return 2
  }

  return matches.sort((left, right) => {
    const rankDifference = rank(left) - rank(right)
    if (rankDifference) return rankDifference
    const codeDifference = left.code.localeCompare(right.code, 'en')
    if (codeDifference) return codeDifference
    const categoryDifference =
      (left.category === Category.TSE ? 0 : 1) -
      (right.category === Category.TSE ? 0 : 1)
    if (categoryDifference) return categoryDifference
    return left.name.localeCompare(right.name, 'zh-Hant')
  })
}

export function resetSecurityDirectoryCache(): void {
  directoryRequest = undefined
  directoryExpiresAt = 0
}

export { SECURITY_DIRECTORY_CACHE_TTL_MS, TDCC_SECURITIES_URL, TDCC_TIMEOUT_MS }
