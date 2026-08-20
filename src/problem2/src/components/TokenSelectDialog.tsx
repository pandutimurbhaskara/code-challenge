import { useEffect, useMemo, useRef, useState } from 'react'
import type { Token } from '../lib/types'
import { formatBalance, formatUsd } from '../lib/format'
import { TokenIcon } from './TokenIcon'
import './TokenSelectDialog.css'

interface TokenSelectDialogProps {
  tokens: Token[]
  /** Symbol currently selected on this side (highlighted). */
  selected: string
  /** Symbol held by the opposite side. */
  counterpart: string
  onSelect: (token: Token) => void
  onClose: () => void
}

export function TokenSelectDialog({
  tokens,
  selected,
  counterpart,
  onSelect,
  onClose,
}: TokenSelectDialogProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tokens
    return tokens.filter((t) => t.symbol.toLowerCase().includes(q))
  }, [tokens, query])

  // Focus the search box on open.
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Close on dialog on esc click, from anywhere in the dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = listRef.current?.children[active] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const token = results[active]
      if (token) onSelect(token)
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Select a token"
        onKeyDown={handleKeyDown}
      >
        <header className="dialog__head">
          <h2 className="dialog__title">Select a token</h2>
          <button
            type="button"
            className="dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <input
          ref={searchRef}
          className="dialog__search"
          type="text"
          inputMode="search"
          placeholder="Search name"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
        />

        {results.length === 0 ? (
          <p className="dialog__empty">No tokens match “{query}”.</p>
        ) : (
          <ul className="dialog__list" ref={listRef}>
            {results.map((token, i) => (
              <li key={token.symbol}>
                <button
                  type="button"
                  className={
                    'token-row' +
                    (token.symbol === selected ? ' token-row--selected' : '') +
                    (i === active ? ' token-row--active' : '')
                  }
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onSelect(token)}
                >
                  <TokenIcon symbol={token.symbol} src={token.iconUrl} size={34} />
                  <span className="token-row__id">
                    <span className="token-row__symbol">{token.symbol}</span>
                    {token.symbol === counterpart && (
                      <span className="token-row__tag">other side</span>
                    )}
                  </span>
                  <span className="token-row__meta">
                    <span className="token-row__price">
                      {formatUsd(token.price)}
                    </span>
                    <span className="token-row__balance">
                      {formatBalance(token.balance)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
