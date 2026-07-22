import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('application shell', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the canonical product heading', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'AI Agentic Flow' }),
    ).toBeInTheDocument()
  })

  it('wires playback controls to the controller and its single timer', () => {
    vi.useFakeTimers()
    render(<App />)

    const start = screen.getByRole('button', { name: 'Start' })
    expect(start).toBeEnabled()
    fireEvent.click(start)
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled()

    act(() => vi.advanceTimersByTime(1_000))
    expect(screen.getByLabelText('Demo time 00:01 of 10:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByRole('button', { name: 'Resume' })).toBeEnabled()
    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.getByLabelText('Demo time 00:01 of 10:00')).toBeInTheDocument()
  })
})
