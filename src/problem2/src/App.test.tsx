/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import type { Token } from './lib/types'
import { loadTokens } from './lib/prices'
import App from './App'

jest.mock('./lib/prices', () => ({ loadTokens: jest.fn() }))

const tokens: Token[] = [
  { symbol: 'ETH', price: 2000, date: 'd', iconUrl: 'x/ETH.svg', balance: 10 },
  { symbol: 'USDC', price: 1, date: 'd', iconUrl: 'x/USDC.svg', balance: 5000 },
]

const mockedLoad = jest.mocked(loadTokens)

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn()
  mockedLoad.mockResolvedValue({ tokens, stale: false })
  document.documentElement.removeAttribute('data-theme')
  localStorage.clear()
})

describe('App', () => {
  it('renders the page shell and the swap card', async () => {
    render(<App />)
    expect(screen.getByText('Exchange desk')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Swap' }),
    ).toBeInTheDocument()
  })

  it('toggles the theme and persists the choice', async () => {
    render(<App />)
    await screen.findByRole('heading', { name: 'Swap' })

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument()
  })
})
