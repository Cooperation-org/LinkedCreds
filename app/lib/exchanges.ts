import { LRUCache } from 'lru-cache'

declare global {
  var exchanges: any | undefined
}

export async function pollExchange({
  exchangeUrl,
  onFetchVP,
  stopPolling // Add stopPolling callback
}: {
  exchangeUrl: string
  onFetchVP: (vp: any) => void
  stopPolling: () => void // Stop polling when credential is fetched
}): Promise<void> {
  const result = await fetch(exchangeUrl, {})

  if (result.ok && result.status === 200) {
    const vp = (await result.json()) as any
    console.log('Fetched vp:', typeof vp, vp)
    onFetchVP(vp) // Pass the fetched VC back to onFetchVC callback
    stopPolling() // Stop polling after credential is fetched
  }
}

export const exchanges =
  globalThis.exchanges || new LRUCache({ ttl: 5 * 60 * 1000, ttlAutopurge: true })

globalThis.exchanges = exchanges
