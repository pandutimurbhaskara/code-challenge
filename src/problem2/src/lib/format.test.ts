import {
  formatAmount,
  formatBalance,
  formatUsd,
  parseAmount,
  sanitizeAmountInput,
} from './format'

describe('sanitizeAmountInput', () => {
  it('drops any character that is not a digit or a dot', () => {
    expect(sanitizeAmountInput('1,000.50 ETH')).toBe('1000.50')
    expect(sanitizeAmountInput('$42')).toBe('42')
    expect(sanitizeAmountInput('abc')).toBe('')
  })

  it('keeps only the first dot', () => {
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23')
    expect(sanitizeAmountInput('..5')).toBe('.5')
  })

  it('leaves a leading dot in place', () => {
    expect(sanitizeAmountInput('.5')).toBe('.5')
  })
})

describe('parseAmount', () => {
  it('parses a numeric string', () => {
    expect(parseAmount('1.5')).toBe(1.5)
    expect(parseAmount('0')).toBe(0)
  })

  it('returns NaN for empty, whitespace, or a lone dot', () => {
    expect(parseAmount('')).toBeNaN()
    expect(parseAmount('   ')).toBeNaN()
    expect(parseAmount('.')).toBeNaN()
  })
})

describe('formatAmount', () => {
  it('renders zero and non-finite values as "0"', () => {
    expect(formatAmount(0)).toBe('0')
    expect(formatAmount(NaN)).toBe('0')
    expect(formatAmount(Infinity)).toBe('0')
  })

  it('trims trailing zeros', () => {
    expect(formatAmount(1.25)).toBe('1.25')
    expect(formatAmount(2)).toBe('2')
    expect(formatAmount(0.1)).toBe('0.1')
  })

  it('keeps more precision for sub-1 values', () => {
    expect(formatAmount(0.123456789)).toBe('0.12345679')
  })
})

describe('formatUsd', () => {
  it('groups thousands and shows two decimals at or above $1', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50')
    expect(formatUsd(1234.567)).toBe('$1,234.57')
  })

  it('allows up to four decimals below $1', () => {
    expect(formatUsd(0.999183113)).toBe('$0.9992')
    expect(formatUsd(0.5)).toBe('$0.50')
  })

  it('falls back to $0.00 for non-finite values', () => {
    expect(formatUsd(NaN)).toBe('$0.00')
  })
})

describe('formatBalance', () => {
  it('groups thousands and caps at four decimals', () => {
    expect(formatBalance(12480.5)).toBe('12,480.5')
    expect(formatBalance(1000000)).toBe('1,000,000')
    expect(formatBalance(0.123456)).toBe('0.1235')
  })
})
