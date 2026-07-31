import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('application shell', () => {
  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 })
    act(() => window.dispatchEvent(new Event('resize')))
  })

  function useDesktopViewport() {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 })
  }

  it('renders the canonical product heading', () => {
    useDesktopViewport()
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'AI Agentic Flow' }),
    ).toBeInTheDocument()
  })

  it('wires playback controls to the controller and its single timer', () => {
    useDesktopViewport()
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

  it('restarts the guided introduction without duplicate content', () => {
    useDesktopViewport()
    vi.useFakeTimers()
    render(<App />)

    expect(
      screen.getByText('Demo is ready. Press Start to begin.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(
      screen.getByRole('status', { name: 'Customer is typing' }),
    ).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(14_000))
    expect(screen.getByAltText('Preview of ceiling leakage evidence')).toBeInTheDocument()
    expect(
      screen.getByAltText('Preview of the fictional handover agreement'),
    ).toBeInTheDocument()
    expect(
      screen.getByAltText('Preview of the fictional payment receipt'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Terima kasih, Bu Rina/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
    expect(
      screen.getByText('Demo is ready. Press Start to begin.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Terima kasih, Bu Rina/)).not.toBeInTheDocument()
    expect(screen.queryByAltText('Preview of ceiling leakage evidence')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('status', { name: 'Customer is typing' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Demo ready')).toBeInTheDocument()
    expect(screen.queryByText('Customer evidence verified')).not.toBeInTheDocument()
    expect(screen.queryByText('Evidence found')).not.toBeInTheDocument()
    const resetAgents = screen.getAllByRole('listitem', {
      name: /Agent, Waiting$/,
    })
    expect(resetAgents).toHaveLength(4)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(
      screen.getAllByRole('status', { name: 'Customer is typing' }),
    ).toHaveLength(1)
    act(() => vi.advanceTimersByTime(9_000))
    expect(
      screen.getAllByRole('listitem', {
        name: 'Customer Complaint Agent, Working',
      }),
    ).toHaveLength(1)
  })

  it('uses one shared early-story timer from a fresh start', () => {
    useDesktopViewport()
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(6_000))
    expect(
      screen.getByAltText('Preview of the fictional payment receipt'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Rina Putri')).toHaveLength(1)
    setIntervalSpy.mockRestore()
  })

  it('shows the Intake context briefly on start', () => {
    useDesktopViewport()
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('heading', { name: 'Intake' })).toBeInTheDocument()
    expect(
      screen.getByText('Receiving the complaint and supporting attachments.'),
    ).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(12_000))
    expect(screen.queryByRole('heading', { name: 'Intake' })).not.toBeInTheDocument()
  })

  it('keeps one runtime timer while switching mobile presentation views', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 812 })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Open Mobile Story View/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => vi.advanceTimersByTime(5_000))
    expect(screen.getByAltText('Preview of the fictional handover agreement')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Overview' }))
    expect(screen.getByLabelText('Demo time 00:05 of 10:00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Story View' }))
    expect(screen.getByAltText('Preview of the fictional handover agreement')).toBeInTheDocument()
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    setIntervalSpy.mockRestore()
  })

  it('preserves the selected mobile Story View and section through Restart', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 430 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 932 })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Open Mobile Story View/ }))
    fireEvent.click(screen.getByRole('tab', { name: 'Agentic Flow' }))
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => vi.advanceTimersByTime(9_000))
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

    expect(screen.getByRole('tabpanel', { name: 'Agentic Flow' })).toBeInTheDocument()
    expect(screen.getByText('Demo ready')).toBeInTheDocument()
    expect(screen.queryByText(/Thank you, Rina/)).not.toBeInTheDocument()
  })

  it('uses the authoritative approval reducer for a mobile rejection', () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 430 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 932 })
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Open Mobile Story View/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => vi.advanceTimersByTime(5_000))
    fireEvent.click(screen.getByRole('tab', { name: /Customer Story/ }))
    expect(screen.getByAltText('Preview of the fictional handover agreement')).toBeInTheDocument()
  })

  it('uses a single runtime timer across Start and Restart', () => {
    useDesktopViewport()
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => vi.advanceTimersByTime(2_000))
    expect(screen.getByRole('heading', { name: 'Intake' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }))

    expect(
      screen.queryByRole('button', { name: /Presenter Assist/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Demo time 00:00 of 10:00')).toBeInTheDocument()
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    setIntervalSpy.mockRestore()
  })
})
