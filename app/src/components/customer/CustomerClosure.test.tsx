import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  simulateAutoRun,
  transitionRuntimeState,
} from '../../domain/runtime'
import { CustomerClosure } from './CustomerClosure'

function renderIdle() {
  const idle = createInitialRuntimeState()
  return render(<CustomerClosure viewModel={selectRuntimeViewModel(idle)} />)
}

function renderApproved() {
  const finalState = simulateAutoRun()
  return {
    finalState,
    ...render(
      <CustomerClosure viewModel={selectRuntimeViewModel(finalState)} />,
    ),
  }
}

describe('CustomerClosure', () => {
  it('renders nothing while the runtime is idle', () => {
    const { container } = renderIdle()
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing during the internal work (Intake, Investigation, Approval)', () => {
    const started = transitionRuntimeState(
      createInitialRuntimeState('auto'),
      { type: 'START' },
    )
    for (const seconds of [30, 152, 240, 300, 390]) {
      const state = transitionRuntimeState(started, {
        type: 'ADVANCE_TIME',
        seconds,
      })
      const { container, unmount } = render(
        <CustomerClosure viewModel={selectRuntimeViewModel(state)} />,
      )
      expect(container.firstChild).toBeNull()
      unmount()
    }
  })

  it('renders nothing when the reviewer rejects (escalated outcome)', () => {
    const started = transitionRuntimeState(
      createInitialRuntimeState('auto'),
      { type: 'START' },
    )
    const gate = transitionRuntimeState(started, {
      type: 'ADVANCE_TIME',
      seconds: 390,
    })
    const rejected = transitionRuntimeState(gate, { type: 'REJECT' })
    const { container } = render(
      <CustomerClosure viewModel={selectRuntimeViewModel(rejected)} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the closure card at the end of the Auto run', () => {
    renderApproved()
    const card = screen.getByTestId('customer-closure')
    expect(card).toBeInTheDocument()
    expect(card.getAttribute('data-status')).toBe('delivered')
    // Sender and role.
    expect(within(card).getByText('AI Resolution Officer')).toBeInTheDocument()
    expect(within(card).getByText('Customer Care')).toBeInTheDocument()
    // Timestamp derived from final moment.
    const timestamp = within(card).getByTestId('customer-closure-timestamp')
    expect(timestamp).toHaveTextContent('10:00 AM')
    expect(timestamp.getAttribute('dateTime')).toBe('10:00:00')
  })

  it('renders exactly the five customer-facing closure lines', () => {
    renderApproved()
    const body = screen.getByTestId('customer-closure-body')
    expect(body).toHaveTextContent('Thank you for your patience, Rina.')
    expect(body).toHaveTextContent(/Your case has been resolved/i)
    expect(body).toHaveTextContent(/inspection has been scheduled within 24 hours/i)
    expect(body).toHaveTextContent(
      /Compensation of Rp31,000,000 has been approved and processed/i,
    )
    expect(body).toHaveTextContent(
      /keep you informed until all follow-up actions are completed/i,
    )
  })

  it('displays the delivered chip and delivery status label', () => {
    renderApproved()
    const chip = screen.getByTestId('customer-closure-chip')
    expect(chip).toHaveTextContent('Resolution Delivered')
    expect(chip.getAttribute('aria-label')).toMatch(/Delivery status:/)
    // Delivered label alongside chip.
    const card = screen.getByTestId('customer-closure')
    expect(within(card).getByText('Delivered')).toBeInTheDocument()
  })

  it('never leaks internal / AI / recommendation / policy wording in the message body', () => {
    renderApproved()
    const body = screen.getByTestId('customer-closure-body')
    const forbidden =
      /\bAI\b|recommendation|investigation|conflict|policy|internal approval|enterprise system|SAP\b|CRM\b|reasoning|correlat|specialist agent/i
    expect(body.textContent ?? '').not.toMatch(forbidden)
  })
})

// UX-14A — auto-scroll behaviour when the closure first becomes visible.
describe('CustomerClosure — auto-scroll on first visibility (UX-14A)', () => {
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
  const originalMatchMedia = window.matchMedia
  let scrollSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    scrollSpy = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollSpy as unknown as typeof HTMLElement.prototype.scrollIntoView
  })

  afterEach(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    window.matchMedia = originalMatchMedia
  })

  function withReducedMotion(reduce: boolean) {
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce') && reduce,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
  }

  it('does NOT scroll while the runtime is idle (closure not visible)', () => {
    withReducedMotion(false)
    const idle = createInitialRuntimeState()
    render(<CustomerClosure viewModel={selectRuntimeViewModel(idle)} />)
    expect(scrollSpy).not.toHaveBeenCalled()
  })

  it('scrolls the closure card into view exactly once when first visible', () => {
    withReducedMotion(false)
    renderApproved()
    expect(scrollSpy).toHaveBeenCalledTimes(1)
    expect(scrollSpy).toHaveBeenCalledWith({
      block: 'end',
      behavior: 'smooth',
    })
  })

  it('honours prefers-reduced-motion by degrading to instantaneous scroll', () => {
    withReducedMotion(true)
    renderApproved()
    expect(scrollSpy).toHaveBeenCalledTimes(1)
    expect(scrollSpy).toHaveBeenCalledWith({
      block: 'end',
      behavior: 'auto',
    })
  })

  it('does not re-scroll on subsequent re-renders once already scrolled', () => {
    withReducedMotion(false)
    const finalState = simulateAutoRun()
    const { rerender } = render(
      <CustomerClosure viewModel={selectRuntimeViewModel(finalState)} />,
    )
    expect(scrollSpy).toHaveBeenCalledTimes(1)
    // Simulate an unrelated parent re-render with the same visibility.
    rerender(<CustomerClosure viewModel={selectRuntimeViewModel(finalState)} />)
    rerender(<CustomerClosure viewModel={selectRuntimeViewModel(finalState)} />)
    expect(scrollSpy).toHaveBeenCalledTimes(1)
  })

  it('scrolls once when the runtime transitions from mid-flow to approved', () => {
    withReducedMotion(false)
    const started = transitionRuntimeState(
      createInitialRuntimeState('auto'),
      { type: 'START' },
    )
    const midFlow = transitionRuntimeState(started, {
      type: 'ADVANCE_TIME',
      seconds: 240,
    })
    const { rerender } = render(
      <CustomerClosure viewModel={selectRuntimeViewModel(midFlow)} />,
    )
    // Not visible yet — no scroll.
    expect(scrollSpy).not.toHaveBeenCalled()
    // Runtime completes — closure becomes visible → one scroll.
    const finalState = simulateAutoRun()
    rerender(<CustomerClosure viewModel={selectRuntimeViewModel(finalState)} />)
    expect(scrollSpy).toHaveBeenCalledTimes(1)
  })
})

