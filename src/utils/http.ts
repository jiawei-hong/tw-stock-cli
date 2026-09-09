export async function requestJson<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (
      data &&
      typeof data === 'object' &&
      'rtcode' in data &&
      data.rtcode !== '0000'
    ) {
      throw new Error(
        `Upstream error ${data.rtcode}: ${data.rtmessage ?? 'unknown'}`
      )
    }
    return data as T
  } catch (error) {
    throw new Error(
      `Request failed for ${new URL(url).hostname}: ${String(error)}`
    )
  }
}
