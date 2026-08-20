/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import type { Token } from '../lib/types'
import { loadTokens } from '../lib/prices'
import { SwapCard } from './SwapCard'

jest.mock('../lib/prices', () => ({ loadTokens: jest.fn() }))

const tokens: Token[] = [
  { symbol: 'ETH', price: 2000, date: 'd', iconUrl: 'x/ETH.svg', balance: 10 },
  { symbol: 'USDC', price: 1, date: 'd', iconUrl: 'x/USDC.svg', balance: 5000 },
  { symbol: 'BTC', price: 30000, date: 'd', iconUrl: 'x/BTC.svg', balance: 2 },
]

const mockedLoad = jest.mocked(loadTokens)

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn()
  mockedLoad.mockResolvedValue({ tokens, stale: false })
})

afterEach(() => {
  jest.useRealTimers()
})

async function ready() {
  const utils = render(<SwapCard />)
  await screen.findByLabelText('You pay')
  return utils
}

const payInput = () => screen.getByLabelText('You pay') as HTMLInputElement
const receiveInput = () => screen.getByLabelText('You receive') as HTMLInputElement

describe('SwapCard', () => {
  it('shows a loading state until prices arrive', async () => {
    render(<SwapCard />)
    expect(screen.getByText('Fetching live prices…')).toBeInTheDocument()
    expect(await screen.findByLabelText('You pay')).toBeInTheDocument()
  })

  it('converts the pay amount into the receive amount', async () => {
    await ready()
    fireEvent.change(payInput(), { target: { value: '1' } })
    expect(receiveInput().value).toBe('2000')
  })

  it('recomputes the pay side when the receive amount is edited', async () => {
    await ready()
    fireEvent.change(receiveInput(), { target: { value: '3000' } })
    expect(payInput().value).toBe('1.5')
  })

  it('shows the rate and flips it when the direction is switched', async () => {
    const { container } = await ready()
    expect(container.querySelector('.rule__rate')).toHaveTextContent(
      '1 ETH = 2000 USDC',
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch pay and receive tokens' }),
    )
    expect(container.querySelector('.rule__rate')).toHaveTextContent(
      '1 USDC = 0.0005 ETH',
    )
  })

  it('fills the full balance from the Max control', async () => {
    await ready()
    fireEvent.click(screen.getByRole('button', { name: /Balance/ }))
    expect(payInput().value).toBe('10')
  })

  it('blocks the swap when the balance is too low', async () => {
    const { container } = await ready()
    fireEvent.change(payInput(), { target: { value: '11' } })
    const submit = screen.getByRole('button', {
      name: 'Insufficient ETH balance',
    })
    expect(submit).toBeDisabled()
    expect(container.querySelector('.field--error')).toBeInTheDocument()
  })

  it('submits a valid swap and debits the balance after the delay', async () => {
    await ready()
    fireEvent.change(payInput(), { target: { value: '2' } })
    jest.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Swap ETH for USDC' }))

    act(() => {
      jest.advanceTimersByTime(1600)
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Swapped 2 ETH for 4000 USDC',
    )
    expect(screen.getByRole('button', { name: /Balance/ })).toHaveTextContent(
      'Balance 8',
    )
  })
})
