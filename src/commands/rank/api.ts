import { RankOtcResponse, RankTseResponse } from '@/types/rank'
import { requestJson } from '@/utils/http'

function fetchRankData<T extends RankTseResponse | RankOtcResponse>(
  url: string
): Promise<T> {
  return requestJson<T>(url)
}

export { fetchRankData }
