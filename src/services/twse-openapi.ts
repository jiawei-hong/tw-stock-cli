import { requestJson } from '@/utils/http'

const TWSE_OPENAPI_URL = 'https://openapi.twse.com.tw/v1'

export async function getTwseOpenData<T>(path: string): Promise<T[]> {
  const data = await requestJson<unknown>(`${TWSE_OPENAPI_URL}/${path}`)
  if (
    !Array.isArray(data) ||
    data.some((row) => !row || typeof row !== 'object' || Array.isArray(row))
  ) {
    throw new Error('Invalid TWSE OpenAPI response')
  }
  return data as T[]
}

export function formatRocDate(value: string): string {
  const compact = value.replaceAll('/', '')
  if (!/^\d{7}$/.test(compact)) return value || '-'
  return `${Number(compact.slice(0, 3)) + 1911}-${compact.slice(
    3,
    5
  )}-${compact.slice(5)}`
}

export function formatRocMonth(value: string): string {
  if (!/^\d{5}$/.test(value)) return value || '-'
  return `${Number(value.slice(0, 3)) + 1911}-${value.slice(3)}`
}
