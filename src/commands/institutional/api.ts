import {
  InstitutionalOtcResponse,
  InstitutionalSummaryResponse,
} from '@/types/institutional'
import { type RequestJsonOptions, requestJson } from '@/utils/http'

function isInstitutionalResponse(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const response = value as {
    stat?: unknown
    data?: unknown
    aaData?: unknown
    tables?: unknown
  }
  const hasTseData =
    typeof response.stat === 'string' && Array.isArray(response.data)
  // TPEx now returns rows in tables[0].data; older responses used aaData.
  const hasOtcTables =
    Array.isArray(response.tables) &&
    response.tables.length > 0 &&
    Array.isArray((response.tables[0] as { data?: unknown })?.data)
  const hasOtcData = Array.isArray(response.aaData)
  return hasTseData || hasOtcTables || hasOtcData
}

function fetchInstitutionalData<
  T extends InstitutionalSummaryResponse | InstitutionalOtcResponse
>(url: string, options?: RequestJsonOptions): Promise<T> {
  return requestJson<unknown>(url, options).then((data) => {
    if (!isInstitutionalResponse(data)) {
      throw new Error('Invalid institutional response payload')
    }
    return data as T
  })
}

export { fetchInstitutionalData }
