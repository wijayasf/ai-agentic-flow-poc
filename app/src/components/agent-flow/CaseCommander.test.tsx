import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CaseCommander } from './CaseCommander'

describe('CaseCommander — dynamic identity (Standby ↔ Command Mode)', () => {
  it('defaults to Standby (blue) when no props are passed', () => {
    render(<CaseCommander />)
    const card = screen.getByLabelText('Case Commander')
    expect(card.getAttribute('data-command-mode')).toBe('standby')
    expect(card.getAttribute('data-orchestrating')).toBeNull()
    expect(card.getAttribute('data-phase')).toBeNull()
    expect(card.getAttribute('data-attention')).toBeNull()
  })

  it('stays in Standby when commandActive is false, even if stage props are set', () => {
    render(
      <CaseCommander
        orchestrationActive
        dispatchingWave
        investigationMonitoring
        conflictActive
      />,
    )
    const card = screen.getByLabelText('Case Commander')
    expect(card.getAttribute('data-command-mode')).toBe('standby')
    expect(card.getAttribute('data-orchestrating')).toBeNull()
    expect(card.getAttribute('data-phase')).toBeNull()
    expect(card.getAttribute('data-attention')).toBeNull()
  })

  it('enters Command Mode (red) the moment commandActive becomes true', () => {
    const { rerender } = render(<CaseCommander />)
    const card = screen.getByLabelText('Case Commander')
    expect(card.getAttribute('data-command-mode')).toBe('standby')
    rerender(<CaseCommander commandActive />)
    expect(card.getAttribute('data-command-mode')).toBe('active')
  })

  it('returns to Standby when commandActive becomes false again', () => {
    const { rerender } = render(<CaseCommander commandActive conflictActive />)
    const card = screen.getByLabelText('Case Commander')
    expect(card.getAttribute('data-command-mode')).toBe('active')
    expect(card.getAttribute('data-attention')).toBe('conflict')
    rerender(<CaseCommander />)
    expect(card.getAttribute('data-command-mode')).toBe('standby')
    expect(card.getAttribute('data-attention')).toBeNull()
  })

  it('exposes stage annotations only while in Command Mode', () => {
    render(
      <CaseCommander
        commandActive
        orchestrationActive
        dispatchingWave
        investigationMonitoring
        conflictActive
      />,
    )
    const card = screen.getByLabelText('Case Commander')
    // orchestrationActive wins for phase resolution.
    expect(card.getAttribute('data-command-mode')).toBe('active')
    expect(card.getAttribute('data-orchestrating')).toBe('true')
    expect(card.getAttribute('data-phase')).toBe('dispatching')
    expect(card.getAttribute('data-attention')).toBe('conflict')
  })
})

describe('CaseCommander — local user-star asset', () => {
  it('renders the local user-star asset (no remote URL, decorative alt)', () => {
    render(<CaseCommander />)
    const glyph = screen.getByTestId('case-commander-glyph')
    expect(glyph.tagName).toBe('IMG')
    expect(glyph.getAttribute('src')).toBe('/assets/icons/user-star.png')
    expect(glyph.getAttribute('alt')).toBe('')
    expect(glyph.getAttribute('src')).not.toMatch(/^https?:/)
    expect(glyph.getAttribute('src')).not.toMatch(/Downloads\/files/)
  })

  it('preserves the accessible name "Case Commander" in both modes', () => {
    const { rerender } = render(<CaseCommander />)
    expect(screen.getByLabelText('Case Commander')).toBeInTheDocument()
    expect(screen.getByText('Case Commander')).toBeInTheDocument()
    rerender(<CaseCommander commandActive conflictActive />)
    expect(screen.getByLabelText('Case Commander')).toBeInTheDocument()
    expect(screen.getByText('Case Commander')).toBeInTheDocument()
  })
})
