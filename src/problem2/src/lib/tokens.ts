/**
 * Icons come from the Switcheo token-icons repo. A handful of tickers are cased
 * differently there than in the price feed, so they are remapped explicitly.
 */

const ICON_BASE =
  'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens'

/** Price-feed symbol -> icon-repo filename (only where they differ). */
const ICON_OVERRIDES: Record<string, string> = {
  RATOM: 'rATOM',
  STATOM: 'stATOM',
  STEVMOS: 'stEVMOS',
  STLUNA: 'stLUNA',
  STOSMO: 'stOSMO',
}

export function iconUrl(symbol: string): string {
  const file = ICON_OVERRIDES[symbol] ?? symbol
  return `${ICON_BASE}/${file}.svg`
}

/** symbol name used for deterministic mock data. */
function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function mockBalance(symbol: string, price: number): number {
  if (price <= 0) return 0
  const usd = 400 + (hash(symbol) % 23600)
  return usd / price
}

export function monogramColor(symbol: string): string {
  const hue = hash(symbol) % 360
  return `hsl(${hue} 62% 52%)`
}
