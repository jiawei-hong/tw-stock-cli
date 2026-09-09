import {
  InstitutionalOtcResponse,
  InstitutionalSummaryResponse,
} from '@/types/institutional'
import { requestJson } from '@/utils/http'

function fetchInstitutionalData<
  T extends InstitutionalSummaryResponse | InstitutionalOtcResponse
>(url: string): Promise<T> {
  return requestJson<T>(url)
}

export { fetchInstitutionalData }
