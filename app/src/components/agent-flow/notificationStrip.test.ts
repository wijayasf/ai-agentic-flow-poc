import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import { selectNotificationStrip } from './notificationStrip'

function stateAt(seconds: number): RuntimeState {
  const started = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(started, { type: 'ADVANCE_TIME', seconds })
}

describe('selectNotificationStrip', () => {
  it('returns null while the runtime is idle', () => {
    expect(selectNotificationStrip(createInitialRuntimeState())).toBeNull()
  })

  it('shows the Investigation message across M04-M08 with progress tone', () => {
    for (const t of [92, 122, 152, 182, 212]) {
      const strip = selectNotificationStrip(stateAt(t))
      expect(strip?.message).toBe('AI investigation in progress...')
      expect(strip?.tone).toBe('progress')
    }
  })

  it('flips to the Conflict message at M09 with success tone', () => {
    const strip = selectNotificationStrip(stateAt(240))
    expect(strip?.key).toBe('M09')
    expect(strip?.message).toBe('Evidence correlation completed. Review findings below.')
    expect(strip?.tone).toBe('success')
  })

  it('shows the Approval message from M10 through M13 with awaiting tone', () => {
    for (const t of [270, 300, 330, 390]) {
      const strip = selectNotificationStrip(stateAt(t))
      expect(strip?.message).toBe('AI analysis completed. Waiting for reviewer decision.')
      expect(strip?.tone).toBe('awaiting')
    }
  })

  it('returns null for moments outside the mapped window (pre-investigation)', () => {
    expect(selectNotificationStrip(stateAt(0))?.key).not.toBe('M04')
    expect(selectNotificationStrip(stateAt(30))).toBeNull() // M02
    expect(selectNotificationStrip(stateAt(62))).toBeNull() // M03
  })

  it('avoids technical wording like "approval gate", "workflow gate", "runtime state"', () => {
    const technical = /approval gate|workflow gate|runtime state|state transition/i
    for (const t of [92, 122, 152, 182, 212, 240, 270, 300, 330, 390]) {
      const strip = selectNotificationStrip(stateAt(t))
      if (strip !== null) {
        expect(strip.message).not.toMatch(technical)
      }
    }
  })

  it('never surfaces outcome / execution / compensation wording', () => {
    const forbidden =
      /execution|customer notified|sap updated|refund granted|refund denied|compensation|resolution package|final resolution|Rp31|inspection scheduled/i
    for (const t of [92, 122, 152, 182, 212, 240, 270, 300, 330, 390]) {
      const strip = selectNotificationStrip(stateAt(t))
      if (strip !== null) {
        expect(strip.message).not.toMatch(forbidden)
      }
    }
  })
})
