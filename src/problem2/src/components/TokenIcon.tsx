import { useState } from 'react'
import { monogramColor } from '../lib/tokens'

interface TokenIconProps {
  symbol: string
  src: string
  size?: number
}

/**
 * Token logo from the remote SVG set, use colored monogram if
 * image is missing or offline. The monogram color is stable per symbol.
 */
export function TokenIcon({ symbol, src, size = 32 }: TokenIconProps) {
  // Track the src that failed so a changed src (list reuse) retries cleanly,
  // without resetting state from an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === src

  const style = { width: size, height: size }

  if (failed) {
    return (
      <span
        className="token-icon token-icon--fallback"
        style={{ ...style, background: monogramColor(symbol) }}
        aria-hidden="true"
      >
        {symbol.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() ||
          symbol.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      className="token-icon"
      style={style}
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  )
}
