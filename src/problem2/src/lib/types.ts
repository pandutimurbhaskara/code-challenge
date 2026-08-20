/** price record as returned by the prices endpoint. */
export interface PriceRecord {
  currency: string
  date: string
  price: number
}

export interface Token {
  /** Ticker symbol, e.g. "ETH". Unique within the token list. */
  symbol: string
  /** USD price per unit. */
  price: number
  /** ISO timestamp of the price quote. */
  date: string
  /** Remote SVG icon URL. */
  iconUrl: string
  /** Deterministic mock wallet balance, in token units. */
  balance: number
}
