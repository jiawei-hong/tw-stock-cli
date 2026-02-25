import {
  InstitutionalOtcResponse,
  InstitutionalSummaryResponse,
} from '@/types/institutional'
import { displayFailed } from '@/utils/text'

function fetchInstitutionalData<
  T extends InstitutionalSummaryResponse | InstitutionalOtcResponse
>(url: string): Promise<T> {
  return fetch(url)
    .then((res) => res.json())
    .catch((err) => displayFailed(err))
}

export { fetchInstitutionalData }
