import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Token } from '../lib/types'
import { loadTokens } from '../lib/prices'

type Status = 'loading' | 'ready' | 'error'

/** A signed change to a token's balance, e.g. after a swap. */
export interface BalanceChange {
  symbol: string
  delta: number
}

interface TokensState {
  status: Status
  tokens: Token[]
  stale: boolean
  reload: () => void
  applyBalanceChanges: (changes: BalanceChange[]) => void
}

/**
 * Loads the token list once on mount, with a manual reload for retries.
 * balances are simulated, see mockBalance function in src/problem2/src/lib/tokens.ts
 * Balance changes from swaps are tracked as in-memory. Because they are never persisted, 
 * refreshing the
 * page returns every balance to its original value.
 */
export function useTokens(): TokensState {
  const [status, setStatus] = useState<Status>('loading')
  const [baseTokens, setBaseTokens] = useState<Token[]>([])
  const [stale, setStale] = useState(false)
  const [nonce, setNonce] = useState(0)
  const [deltas, setDeltas] = useState<Record<string, number>>({})

  const reload = useCallback(() => {
    setStatus('loading')
    setDeltas({})
    setNonce((n) => n + 1)
  }, [])

  const applyBalanceChanges = useCallback((changes: BalanceChange[]) => {
    setDeltas((prev) => {
      const next = { ...prev }
      for (const { symbol, delta } of changes) {
        next[symbol] = (next[symbol] ?? 0) + delta
      }
      return next
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadTokens(controller.signal)
      .then((result) => {
        setBaseTokens(result.tokens)
        setStale(result.stale)
        setStatus('ready')
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error')
      })
    return () => controller.abort()
  }, [nonce])

  // Layer in-memory deltas over the base balances.
  const tokens = useMemo(
    () =>
      baseTokens.map((token) => {
        const delta = deltas[token.symbol]
        return delta
          ? { ...token, balance: Math.max(0, token.balance + delta) }
          : token
      }),
    [baseTokens, deltas],
  )

  return { status, tokens, stale, reload, applyBalanceChanges }
}
