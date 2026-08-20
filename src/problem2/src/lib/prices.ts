import type { PriceRecord, Token } from './types'
import { iconUrl, mockBalance } from './tokens'
import fallbackPrices from '../data/prices.json'

const PRICES_URL = 'https://interview.switcheo.com/prices.json'

/**
 * Turn raw price records into a clean, sorted token list.
 *
 * - Tokens without a positive price are dropped.
 * - Duplicate currencies are collapsed to their most recent quote.
 */
export function buildTokens(records: PriceRecord[]): Token[] {
  const latest = new Map<string, PriceRecord>()

  for (const record of records) {
    if (!record.price || record.price <= 0) continue
    const existing = latest.get(record.currency)
    if (!existing || record.date > existing.date) {
      latest.set(record.currency, record)
    }
  }

  return Array.from(latest.values())
    .map((record) => ({
      symbol: record.currency,
      price: record.price,
      date: record.date,
      iconUrl: iconUrl(record.currency),
      balance: mockBalance(record.currency, record.price),
    }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
}

export interface LoadResult {
  tokens: Token[]
  stale: boolean
}

/** Load live prices. */
export async function loadTokens(signal?: AbortSignal): Promise<LoadResult> {
  try {
    const response = await fetch(PRICES_URL, { signal })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = (await response.json()) as PriceRecord[]
    return { tokens: buildTokens(data), stale: false }
  } catch (error) {
    if (signal?.aborted) throw error
    return { tokens: buildTokens(fallbackPrices as PriceRecord[]), stale: true }
  }
}
