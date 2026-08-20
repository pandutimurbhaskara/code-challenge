/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import type { Token } from '../lib/types'
import { TokenSelectDialog } from './TokenSelectDialog'

const tokens: Token[] = [
  { symbol: 'BTC', price: 30000, date: 'd', iconUrl: 'x/BTC.svg', balance: 2 },
  { symbol: 'ETH', price: 2000, date: 'd', iconUrl: 'x/ETH.svg', balance: 10 },
  { symbol: 'USDC', price: 1, date: 'd', iconUrl: 'x/USDC.svg', balance: 5000 },
]

function open(overrides: Partial<Parameters<typeof TokenSelectDialog>[0]> = {}) {
  const props = {
    tokens,
    selected: 'ETH',
    counterpart: 'USDC',
    onSelect: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  }
  return { props, ...render(<TokenSelectDialog {...props} />) }
}

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn()
})

describe('TokenSelectDialog', () => {
  it('lists every token with its price and balance', () => {
    open()
    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.getByText('$30,000.00')).toBeInTheDocument()
    expect(screen.getByText('5,000')).toBeInTheDocument()
  })

  it('marks the selected token and flags the counterpart', () => {
    open()
    expect(screen.getByRole('button', { name: /ETH/ })).toHaveClass(
      'token-row--selected',
    )
    expect(screen.getByText('other side')).toBeInTheDocument()
  })

  it('filters by symbol as you type', () => {
    open()
    fireEvent.change(screen.getByPlaceholderText('Search name'), {
      target: { value: 'usd' },
    })
    expect(screen.queryByText('BTC')).not.toBeInTheDocument()
    expect(screen.getByText('USDC')).toBeInTheDocument()
  })

  it('shows an empty state when nothing matches', () => {
    open()
    fireEvent.change(screen.getByPlaceholderText('Search name'), {
      target: { value: 'zzz' },
    })
    expect(screen.getByText(/No tokens match/)).toHaveTextContent('zzz')
  })

  it('returns the clicked token', () => {
    const { props } = open()
    fireEvent.click(screen.getByRole('button', { name: /BTC/ }))
    expect(props.onSelect).toHaveBeenCalledWith(tokens[0])
  })

  it('moves the active row with the arrow keys and confirms with Enter', () => {
    const { props } = open()
    const dialog = screen.getByRole('dialog')
    fireEvent.keyDown(dialog, { key: 'ArrowDown' })
    fireEvent.keyDown(dialog, { key: 'Enter' })
    expect(props.onSelect).toHaveBeenCalledWith(tokens[1])
  })

  it('closes on Escape', () => {
    const { props } = open()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(props.onClose).toHaveBeenCalled()
  })

  it('closes on a backdrop click but not on a click inside the dialog', () => {
    const { props } = open()
    fireEvent.mouseDown(screen.getByRole('dialog'))
    expect(props.onClose).not.toHaveBeenCalled()

    fireEvent.mouseDown(document.querySelector('.dialog-backdrop')!)
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })
})
