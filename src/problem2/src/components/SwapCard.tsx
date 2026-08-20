import { useMemo, useState } from 'react'
import type { Token } from '../lib/types'
import { useTokens } from '../hooks/useTokens'
import {
  formatAmount,
  formatBalance,
  formatUsd,
  parseAmount,
  sanitizeAmountInput,
} from '../lib/format'
import { TokenIcon } from './TokenIcon'
import { TokenSelectDialog } from './TokenSelectDialog'
import './SwapCard.css'

type Side = 'pay' | 'receive'

const DEFAULT_PAY = 'ETH'
const DEFAULT_RECEIVE = 'USDC'
const SUBMIT_DELAY_MS = 1600

// Convert `amount` of `from` into units of `to` using USD prices.
// balances value of each assets are simulated see mockBalance function in src/problem2/src/lib/tokens.ts


function convert(amount: string, from: Token, to: Token): string {
  const value = parseAmount(amount)
  if (!isFinite(value)) return ''
  return formatAmount((value * from.price) / to.price)
}

function findToken(tokens: Token[], symbol: string, fallbackIndex: number) {
  return tokens.find((t) => t.symbol === symbol) ?? tokens[fallbackIndex] ?? null
}

export function SwapCard() {
  const { status, tokens, stale, reload, applyBalanceChanges } = useTokens()

  const [paySymbol, setPaySymbol] = useState(DEFAULT_PAY)
  const [receiveSymbol, setReceiveSymbol] = useState(DEFAULT_RECEIVE)
  const [amountInput, setAmountInput] = useState('')
  const [inputSide, setInputSide] = useState<Side>('pay')
  const [dialog, setDialog] = useState<Side | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<string | null>(null)

  const payToken = useMemo(
    () => findToken(tokens, paySymbol, 0),
    [tokens, paySymbol],
  )
  const receiveToken = useMemo(
    () => findToken(tokens, receiveSymbol, 1),
    [tokens, receiveSymbol],
  )

  // Derive the two displayed amounts from the single input.
  const ready = Boolean(payToken && receiveToken)
  const payAmount =
    inputSide === 'pay'
      ? amountInput
      : ready
        ? convert(amountInput, receiveToken!, payToken!)
        : ''
  const receiveAmount =
    inputSide === 'receive'
      ? amountInput
      : ready
        ? convert(amountInput, payToken!, receiveToken!)
        : ''

  function handleAmountChange(side: Side, raw: string) {
    setReceipt(null)
    setInputSide(side)
    setAmountInput(sanitizeAmountInput(raw))
  }

  function chooseToken(side: Side, token: Token) {
    setReceipt(null)
    const otherSymbol = side === 'pay' ? receiveSymbol : paySymbol
    // Picking the token already on the other side flips the pair instead.
    if (token.symbol === otherSymbol) {
      swapDirection()
    } else if (side === 'pay') {
      setPaySymbol(token.symbol)
    } else {
      setReceiveSymbol(token.symbol)
    }
    setDialog(null)
  }

  function swapDirection() {
    setReceipt(null)
    setPaySymbol(receiveSymbol)
    setReceiveSymbol(paySymbol)
    // Flip which side owns the typed value so amounts swap with the tokens.
    setInputSide((s) => (s === 'pay' ? 'receive' : 'pay'))
  }

  function setMax() {
    if (!payToken) return
    setReceipt(null)
    setInputSide('pay')
    setAmountInput(formatAmount(payToken.balance))
  }

  const amount = parseAmount(payAmount)
  const rate =
    payToken && receiveToken ? payToken.price / receiveToken.price : 0
  const payUsd = payToken && isFinite(amount) ? amount * payToken.price : 0
  const receiveValue = parseAmount(receiveAmount)
  const receiveUsd =
    receiveToken && isFinite(receiveValue) ? receiveValue * receiveToken.price : 0

  const validation = useMemo<{
    ready: boolean
    label: string
    insufficient: boolean
  }>(() => {
    if (!payToken || !receiveToken)
      return { ready: false, label: 'Loading prices…', insufficient: false }
    if (!payAmount || !isFinite(amount) || amount <= 0)
      return { ready: false, label: 'Enter an amount', insufficient: false }
    if (amount > payToken.balance)
      return {
        ready: false,
        label: `Insufficient ${payToken.symbol} balance`,
        insufficient: true,
      }
    return {
      ready: true,
      label: `Swap ${payToken.symbol} for ${receiveToken.symbol}`,
      insufficient: false,
    }
  }, [payToken, receiveToken, payAmount, amount])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validation.ready || !payToken || !receiveToken || submitting) return
    const paid = amount
    const received = parseAmount(receiveAmount)
    const from = payToken.symbol
    const to = receiveToken.symbol
    const sent = `${formatAmount(paid)} ${from}`
    const got = `${formatAmount(received)} ${to}`
    setSubmitting(true)
    setReceipt(null)
    // Mock backend : on success, debit the sent token and credit the
    // received one. These balance changes live in memory only.
    window.setTimeout(() => {
      applyBalanceChanges([
        { symbol: from, delta: -paid },
        { symbol: to, delta: received },
      ])
      setReceipt(`Swapped ${sent} for ${got}`)
      setSubmitting(false)
      setAmountInput('')
    }, SUBMIT_DELAY_MS)
  }

  if (status === 'loading') {
    return (
      <section className="card card--status" aria-busy="true">
        <div className="spinner spinner--lg" />
        <p>Fetching live prices…</p>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="card card--status">
        <p className="card__error">Couldn’t load prices.</p>
        <button type="button" className="btn btn--ghost" onClick={reload}>
          Try again
        </button>
      </section>
    )
  }

  return (
    <>
      <form className="card" onSubmit={handleSubmit} noValidate>
        <header className="card__head">
          <h1 className="card__title">Swap</h1>
          {stale && (
            <span className="badge badge--stale" title="Live feed unavailable">
              offline prices
            </span>
          )}
        </header>

        {/* You pay */}
        <div className={'field' + (validation.insufficient ? ' field--error' : '')}>
          <div className="field__top">
            <label className="field__label" htmlFor="pay-input">
              You pay
            </label>
            {payToken && (
              <button type="button" className="field__max" onClick={setMax}>
                Balance {formatBalance(payToken.balance)}
              </button>
            )}
          </div>
          <div className="field__row">
            <input
              id="pay-input"
              className="field__amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={payAmount}
              onChange={(e) => handleAmountChange('pay', e.target.value)}
            />
            <TokenButton token={payToken} onClick={() => setDialog('pay')} />
          </div>
          <div className="field__usd">{payUsd > 0 ? formatUsd(payUsd) : '—'}</div>
        </div>

        {/* Ledger rule + direction toggle + live rate */}
        <div className="rule">
          <button
            type="button"
            className="rule__swap"
            onClick={swapDirection}
            aria-label="Switch pay and receive tokens"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M7 4v13M7 4L4 7M7 4l3 3M17 20V7M17 20l3-3M17 20l-3-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {payToken && receiveToken && (
            <span className="rule__rate">
              1 {payToken.symbol} ={' '}
              <strong>{formatAmount(rate)}</strong> {receiveToken.symbol}
            </span>
          )}
        </div>

        {/* You receive */}
        <div className="field">
          <div className="field__top">
            <label className="field__label" htmlFor="receive-input">
              You receive
            </label>
            {receiveToken && (
              <span className="field__balance">
                Balance {formatBalance(receiveToken.balance)}
              </span>
            )}
          </div>
          <div className="field__row">
            <input
              id="receive-input"
              className="field__amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0"
              value={receiveAmount}
              onChange={(e) => handleAmountChange('receive', e.target.value)}
            />
            <TokenButton
              token={receiveToken}
              onClick={() => setDialog('receive')}
            />
          </div>
          <div className="field__usd">
            {receiveUsd > 0 ? formatUsd(receiveUsd) : '—'}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn--primary"
          disabled={!validation.ready || submitting}
        >
          {submitting ? (
            <>
              <span className="spinner" /> Swapping…
            </>
          ) : (
            validation.label
          )}
        </button>

        {receipt && (
          <p className="receipt" role="status">
            <span className="receipt__check" aria-hidden="true">
              ✓
            </span>
            {receipt}
          </p>
        )}
      </form>

      {dialog && payToken && receiveToken && (
        <TokenSelectDialog
          tokens={tokens}
          selected={(dialog === 'pay' ? payToken : receiveToken).symbol}
          counterpart={(dialog === 'pay' ? receiveToken : payToken).symbol}
          onSelect={(token) => chooseToken(dialog, token)}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}

function TokenButton({
  token,
  onClick,
}: {
  token: Token | null
  onClick: () => void
}) {
  return (
    <button type="button" className="token-pill" onClick={onClick}>
      {token ? (
        <>
          <TokenIcon symbol={token.symbol} src={token.iconUrl} size={24} />
          <span className="token-pill__symbol">{token.symbol}</span>
        </>
      ) : (
        <span className="token-pill__symbol">Select</span>
      )}
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
