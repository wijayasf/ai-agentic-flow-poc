import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createInitialRuntimeState,
  selectRuntimeViewModel,
  simulateAutoRun,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import type { RuntimeControllerActions } from '../../runtime'
import { ResponsiveDemoShell } from './ResponsiveDemoShell'
import { classifyResponsiveLayout } from './responsiveModel'

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height })
  act(() => window.dispatchEvent(new Event('resize')))
}

function createActions(): RuntimeControllerActions {
  return {
    selectMode: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    nextMoment: vi.fn(),
    restart: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  }
}

function autoAtApprovalGate(): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), { type: 'START' })
  // Approval gate is M25 (t=495, dur=20). waiting_approval fires after M25
  // completes at elapsed=515.
  return transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds: 520 })
}

function renderResponsive(state = createInitialRuntimeState(), actions = createActions()) {
  return {
    actions,
    ...render(
      <ResponsiveDemoShell
        state={state}
        viewModel={selectRuntimeViewModel(state)}
        actions={actions}
      />,
    ),
  }
}

afterEach(() => {
  setViewport(1024, 768)
})

describe('responsive model', () => {
  it('uses centralized desktop, tablet, portrait-mobile, and landscape-mobile breakpoints', () => {
    expect(classifyResponsiveLayout({ width: 1440, height: 900 })).toBe('desktop')
    expect(classifyResponsiveLayout({ width: 1024, height: 768 })).toBe('tablet')
    expect(classifyResponsiveLayout({ width: 768, height: 1024 })).toBe('tablet')
    expect(classifyResponsiveLayout({ width: 430, height: 932 })).toBe('mobile-portrait')
    expect(classifyResponsiveLayout({ width: 812, height: 375 })).toBe('mobile-landscape')
  })
})

describe('ResponsiveDemoShell', () => {
  it('does not render Presenter Assist toggle or surface on desktop', () => {
    setViewport(1440, 900)
    renderResponsive()
    expect(
      screen.queryByRole('button', { name: /Presenter Assist/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId('presenter-assist-surface')).not.toBeInTheDocument()
  })

  it('preserves the canonical control room on desktop and tablet', () => {
    setViewport(1440, 900)
    const rendered = renderResponsive()
    expect(screen.getByRole('region', { name: 'desktop control room' })).toBeInTheDocument()
    expect(screen.getByTestId('canonical-design-surface')).toBeInTheDocument()

    setViewport(768, 1024)
    expect(screen.getByRole('region', { name: 'tablet control room' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled()
    rendered.unmount()
  })

  it('shows an advisory mobile entry with both required choices', () => {
    setViewport(375, 812)
    renderResponsive()

    expect(screen.getByRole('heading', { name: 'Best experienced in landscape mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open Mobile Story View/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Full Desktop/ })).toBeInTheDocument()
    expect(screen.getByText(/recommendation only/i)).toBeInTheDocument()
    expect(screen.queryByTestId('canonical-design-surface')).not.toBeInTheDocument()
  })

  it('offers Overview and Mobile Story View from compact landscape entry', () => {
    setViewport(812, 375)
    renderResponsive()

    expect(screen.getByRole('heading', { name: 'Choose your mobile experience' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Open Mobile Story View/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /View Full Desktop/ })).toBeEnabled()
  })

  it('exposes all five accessible Story View sections and explicit pagination', () => {
    setViewport(430, 932)
    renderResponsive()
    fireEvent.click(screen.getByRole('button', { name: /Open Mobile Story View/ }))

    const tabs = screen.getByRole('tablist', { name: 'Mobile story sections' })
    expect(within(tabs).getAllByRole('tab')).toHaveLength(5)
    expect(within(tabs).getByRole('tab', { name: 'Customer Story' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(within(tabs).getByRole('tab', { name: 'Agentic Flow' }))
    expect(screen.getByRole('tabpanel', { name: 'Agentic Flow' })).toBeInTheDocument()
    expect(screen.getByText('Demo ready')).toBeInTheDocument()
    const pager = screen.getByRole('navigation', { name: 'Story section pagination' })
    fireEvent.click(within(pager).getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('tabpanel', { name: 'Trust & Observability' })).toBeInTheDocument()
    fireEvent.click(within(pager).getByRole('button', { name: 'Previous' }))
    expect(screen.getByRole('tabpanel', { name: 'Agentic Flow' })).toBeInTheDocument()
  })

  it('renders progressive customer content from the shared runtime view model', () => {
    setViewport(375, 812)
    const started = transitionRuntimeState(createInitialRuntimeState('auto'), { type: 'START' })
    // EARLY_STORY_SECONDS: handoverAgreement=3, paymentReceipt=4. At t=3 only
    // leakage + handover are visible, payment receipt has not yet appeared.
    const evidence = transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds: 3 })
    renderResponsive(evidence)
    fireEvent.click(screen.getByRole('button', { name: /Open Mobile Story View/ }))

    expect(screen.getByText('Rina Putri')).toBeInTheDocument()
    expect(screen.getByAltText('Preview of ceiling leakage evidence')).toBeInTheDocument()
    expect(screen.getByAltText('Preview of the fictional handover agreement')).toBeInTheDocument()
    expect(screen.queryByAltText('Preview of the fictional payment receipt')).not.toBeInTheDocument()
  })

  it('routes mobile approval actions to the same reducer action callbacks', () => {
    setViewport(430, 932)
    const { actions } = renderResponsive(autoAtApprovalGate())
    fireEvent.click(screen.getByRole('button', { name: /Open Mobile Story View/ }))
    fireEvent.click(screen.getByRole('tab', { name: /Human Approval/ }))

    expect(screen.getByRole('heading', { name: 'Approval required' })).toBeInTheDocument()
    // Compensation amount is kept internal until enterprise approval completes;
    // the gate surface only shows the qualitative impact statement.
    expect(screen.getByText('Compensation approved once workflow completes')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(actions.approve).toHaveBeenCalledTimes(1)
    expect(actions.reject).toHaveBeenCalledTimes(1)
  })

  it('shows approved and escalated outcomes without mobile-only outcome state', () => {
    setViewport(430, 932)
    const approved = simulateAutoRun()
    const rendered = renderResponsive(approved)
    fireEvent.click(screen.getByRole('button', { name: /Open Mobile Story View/ }))
    fireEvent.click(screen.getByRole('tab', { name: /Final Outcome/ }))
    expect(screen.getByRole('heading', { name: 'Case Resolved' })).toBeInTheDocument()
    expect(screen.getByText('Rp31,000,000 compensation approved')).toBeInTheDocument()

    const rejected = transitionRuntimeState(autoAtApprovalGate(), { type: 'REJECT' })
    rendered.rerender(
      <ResponsiveDemoShell
        state={rejected}
        viewModel={selectRuntimeViewModel(rejected)}
        actions={createActions()}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Decision Rejected' })).toBeInTheDocument()
    expect(screen.getByText('Assign senior reviewer')).toBeInTheDocument()
    expect(screen.queryByText('Partial compensation approved')).not.toBeInTheDocument()
  })

  it('provides contained Full Desktop controls without changing runtime state', () => {
    setViewport(375, 812)
    const state = transitionRuntimeState(createInitialRuntimeState('auto'), { type: 'START' })
    renderResponsive(state)
    fireEvent.click(screen.getByRole('button', { name: /View Full Desktop/ }))

    expect(screen.getByRole('region', { name: 'Full desktop control room canvas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fit to Screen' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Reset View' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset View' }))
    expect(screen.getByRole('button', { name: 'Fit to Screen' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Story View' }))
    expect(screen.getByRole('tabpanel', { name: 'Customer Story' })).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Customer is typing' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Views' }))
    expect(screen.getByRole('button', { name: /Open Mobile Story View/ })).toBeInTheDocument()
  })

  it('routes mobile approval callbacks without any Presenter Assist surface', () => {
    setViewport(430, 932)
    const { actions } = renderResponsive(autoAtApprovalGate())
    fireEvent.click(screen.getByRole('button', { name: /Open Mobile Story View/ }))
    fireEvent.click(screen.getByRole('tab', { name: /Human Approval/ }))

    expect(
      screen.queryByRole('button', { name: /Presenter Assist/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId('presenter-assist-surface')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))
    expect(actions.approve).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('tablist', { name: 'Mobile story sections' })).toBeInTheDocument()
  })
})
