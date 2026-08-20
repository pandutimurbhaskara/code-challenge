import { iconUrl, mockBalance, monogramColor } from './tokens'

describe('iconUrl', () => {
  it('builds a URL from the ticker as-is', () => {
    expect(iconUrl('ETH')).toBe(
      'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/ETH.svg',
    )
  })

  it('applies the casing overrides the icon repo expects', () => {
    expect(iconUrl('STATOM')).toMatch(/\/stATOM\.svg$/)
    expect(iconUrl('RATOM')).toMatch(/\/rATOM\.svg$/)
  })
})

describe('mockBalance', () => {
  it('is deterministic per symbol', () => {
    expect(mockBalance('ETH', 1800)).toBe(mockBalance('ETH', 1800))
  })

  it('holds a USD value between $400 and $24,000', () => {
    const usd = mockBalance('ETH', 1800) * 1800
    expect(usd).toBeGreaterThanOrEqual(400)
    expect(usd).toBeLessThan(24000)
  })

  it('returns 0 when the price is not positive', () => {
    expect(mockBalance('ETH', 0)).toBe(0)
    expect(mockBalance('ETH', -5)).toBe(0)
  })
})

describe('monogramColor', () => {
  it('produces a stable hsl color with a hue in range', () => {
    const color = monogramColor('ETH')
    expect(color).toBe(monogramColor('ETH'))
    const hue = Number(color.match(/^hsl\((\d+) /)![1])
    expect(hue).toBeGreaterThanOrEqual(0)
    expect(hue).toBeLessThan(360)
  })
})
