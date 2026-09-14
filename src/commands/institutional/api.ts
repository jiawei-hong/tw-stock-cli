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
  }
  const hasTseData =
    typeof response.stat === 'string' && Array.isArray(response.data)
  const hasOtcData = Array.isArray(response.aaData)
  return hasTseData || hasOtcData
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
