import { RankOtcResponse, RankTseResponse } from '@/types/rank'
import { displayFailed } from '@/utils/text'

function fetchRankData<T extends RankTseResponse | RankOtcResponse>(
  url: string
): Promise<T> {
  return fetch(url)
    .then((res) => res.json())
    .catch((err) => displayFailed(err))
}

export { fetchRankData }
