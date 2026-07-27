import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { NotificationStrip } from './NotificationStrip'

function stateAt(seconds: number | null): RuntimeState {
  if (seconds === null) return createInitialRuntimeState() as RuntimeState
  const started = transitionRuntimeState(
    createInitialRuntimeState('auto'),
    { type: 'START' },
  )
  return transitionRuntimeState(started, {
    type: 'ADVANCE_TIME',
    seconds,
  }) as RuntimeState
}

describe('NotificationStrip', () => {
  it('renders nothing while the runtime is idle', () => {
    const { container } = render(<NotificationStrip state={stateAt(null)} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the Investigation message with progress tone across M04-M08', () => {
    render(<NotificationStrip state={stateAt(92)} />)
    const strip = screen.getByTestId('notification-strip')
    expect(strip.getAttribute('data-tone')).toBe('progress')
    expect(strip).toHaveTextContent('AI investigation in progress...')
    expect(strip.getAttribute('aria-live')).toBe('polite')
    expect(strip.getAttribute('role')).toBe('status')
  })

  it('renders the Conflict message with success tone at M09', () => {
    render(<NotificationStrip state={stateAt(240)} />)
    const strip = screen.getByTestId('notification-strip')
    expect(strip.getAttribute('data-tone')).toBe('success')
    expect(strip).toHaveTextContent('Evidence correlation completed. Review findings below.')
  })

  it('renders the Approval message with awaiting tone at M10-M13', () => {
    for (const t of [270, 330]) {
      const { unmount } = render(<NotificationStrip state={stateAt(t)} />)
      const strip = screen.getByTestId('notification-strip')
      expect(strip.getAttribute('data-tone')).toBe('awaiting')
      expect(strip).toHaveTextContent('AI analysis completed. Waiting for reviewer decision.')
      unmount()
    }
  })
})
