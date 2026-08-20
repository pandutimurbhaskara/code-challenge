/** Number parsing/formatting helpers for the swap form. */

/** Keep only characters that can form a non-negative decimal number. */
export function sanitizeAmountInput(raw: string): string {
  // Strip anything that isn't a digit or a dot.
  let cleaned = raw.replace(/[^\d.]/g, '')
  // Collapse multiple dots to a single one.
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  return cleaned
}

/** Parse a user-entered amount, returning NaN for empty/invalid input. */
export function parseAmount(value: string): number {
  if (value.trim() === '' || value === '.') return NaN
  return Number(value)
}

/**
 * Format a token amount for display: significant precision without a wall of
 * zeros. Small values keep more decimals so sub-cent tokens stay readable.
 */
export function formatAmount(value: number): string {
  if (!isFinite(value) || value === 0) return '0'
  const decimals = value >= 1 ? 6 : 8
  const fixed = value.toFixed(decimals)
  // Trim trailing zeros (and a dangling dot) for a clean read.
  return fixed.replace(/\.?0+$/, '')
}

/** Format a USD value with a currency symbol and grouped thousands. */
export function formatUsd(value: number): string {
  if (!isFinite(value)) return '$0.00'
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  })
}

/** Compact balance readout, e.g. "12,480.5". */
export function formatBalance(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 })
}
