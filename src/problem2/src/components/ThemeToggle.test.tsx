/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('offers to switch to light mode while dark', () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />)
    expect(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    ).toBeInTheDocument()
  })

  it('offers to switch to dark mode while light', () => {
    render(<ThemeToggle theme="light" onToggle={() => {}} />)
    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    ).toBeInTheDocument()
  })

  it('fires onToggle when clicked', () => {
    const onToggle = jest.fn()
    render(<ThemeToggle theme="dark" onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
