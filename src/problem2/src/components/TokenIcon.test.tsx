/**
 * @jest-environment jsdom
 */
import { fireEvent, render } from '@testing-library/react'
import { TokenIcon } from './TokenIcon'

describe('TokenIcon', () => {
  it('renders the remote image by default', () => {
    const { container } = render(
      <TokenIcon symbol="ETH" src="https://icons.example/ETH.svg" />,
    )
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://icons.example/ETH.svg')
  })

  it('falls back to a two-letter monogram when the image fails', () => {
    const { container } = render(
      <TokenIcon symbol="ETH" src="https://icons.example/ETH.svg" />,
    )
    fireEvent.error(container.querySelector('img')!)

    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.token-icon--fallback')).toHaveTextContent(
      'ET',
    )
  })

  it('strips non-letters from the monogram', () => {
    const { container } = render(
      <TokenIcon symbol="bNEO" src="https://icons.example/bNEO.svg" />,
    )
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('.token-icon--fallback')).toHaveTextContent(
      'BN',
    )
  })
})
