import { buildTokens, loadTokens } from './prices'
import { iconUrl } from './tokens'
import type { PriceRecord } from './types'

const sample: PriceRecord[] = [
  { currency: 'USDC', date: '2023-08-01T00:00:00.000Z', price: 1 },
  { currency: 'ETH', date: '2023-08-02T00:00:00.000Z', price: 1800 },
  { currency: 'ETH', date: '2023-08-01T00:00:00.000Z', price: 1500 },
  { currency: 'DEAD', date: '2023-08-01T00:00:00.000Z', price: 0 },
  { currency: 'NEG', date: '2023-08-01T00:00:00.000Z', price: -1 },
]

describe('buildTokens', () => {
  it('drops tokens without a positive price', () => {
    const symbols = buildTokens(sample).map((t) => t.symbol)
    expect(symbols).not.toContain('DEAD')
    expect(symbols).not.toContain('NEG')
  })

  it('collapses duplicate currencies to the most recent quote', () => {
    const eth = buildTokens(sample).find((t) => t.symbol === 'ETH')
    expect(eth?.price).toBe(1800)
  })

  it('sorts by symbol', () => {
    expect(buildTokens(sample).map((t) => t.symbol)).toEqual(['ETH', 'USDC'])
  })

  it('resolves the icon URL and a positive mock balance', () => {
    const eth = buildTokens(sample).find((t) => t.symbol === 'ETH')!
    expect(eth.iconUrl).toBe(iconUrl('ETH'))
    expect(eth.balance).toBeGreaterThan(0)
  })

  it('returns an empty list for no records', () => {
    expect(buildTokens([])).toEqual([])
  })
})

describe('loadTokens', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('returns fresh tokens when the fetch succeeds', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => sample,
    }) as unknown as typeof fetch

    const result = await loadTokens()
    expect(result.stale).toBe(false)
    expect(result.tokens.map((t) => t.symbol)).toEqual(['ETH', 'USDC'])
  })

  it('falls back to the bundled snapshot on an error response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as unknown as typeof fetch

    const result = await loadTokens()
    expect(result.stale).toBe(true)
    expect(result.tokens.length).toBeGreaterThan(0)
  })

  it('falls back when the network request throws', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof fetch

    const result = await loadTokens()
    expect(result.stale).toBe(true)
    expect(result.tokens.length).toBeGreaterThan(0)
  })

  it('rethrows instead of falling back when the request was aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('aborted')) as unknown as typeof fetch

    await expect(loadTokens(controller.signal)).rejects.toThrow()
  })
})
