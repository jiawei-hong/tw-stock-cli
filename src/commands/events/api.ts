import { requestJson } from '@/utils/http'

const TPEX_OPENAPI_URL = 'https://www.tpex.org.tw/openapi/v1'

export function getTpexOpenData<T>(path: string): Promise<T[]> {
  return requestJson<unknown>(`${TPEX_OPENAPI_URL}/${path}`).then((data) => {
    if (!Array.isArray(data)) throw new Error('Invalid TPEx OpenAPI response')
    return data as T[]
  })
}
