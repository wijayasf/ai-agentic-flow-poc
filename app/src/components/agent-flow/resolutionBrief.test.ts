import { describe, expect, it } from 'vitest'
import {
  createInitialRuntimeState,
  transitionRuntimeState,
} from '../../domain/runtime'
import type { RuntimeState } from '../../domain/runtime'
import {
  RESOLUTION_BRIEF_PHASE_LABEL,
  selectResolutionBrief,
} from './resolutionBrief'

function stateAt(seconds: number): RuntimeState {
  const s = transitionRuntimeState(createInitialRuntimeState('auto'), {
    type: 'START',
  })
  return transitionRuntimeState(s, { type: 'ADVANCE_TIME', seconds })
}

function briefAt(seconds: number) {
  const s = stateAt(seconds)
  return selectResolutionBrief(s)
}

describe('selectResolutionBrief', () => {
  it('returns null while the runtime is idle', () => {
    const s = createInitialRuntimeState()
    expect(selectResolutionBrief(s)).toBeNull()
  })

  it('returns null before M10 (Intake, Investigation, Conflict analyzing, M09)', () => {
    // Intake / Investigation
    expect(briefAt(30)).toBeNull() // M01
    expect(briefAt(92)).toBeNull() // M04
    expect(briefAt(152)).toBeNull() // M06
    expect(briefAt(182)).toBeNull() // M07
    // Conflict analyzing beat
    expect(briefAt(212)).toBeNull() // M08
    // Conflict detected (M09) — brief still absent
    expect(briefAt(240)).toBeNull() // M09
  })

  it('at M10 flips to phase "presented" with all required sections', () => {
    const b = briefAt(270)
    expect(b).not.toBeNull()
    expect(b?.phase).toBe('presented')
    expect(b?.subtitle).toBe('Prepared for Human Review')
    expect(b?.executiveSummary).toMatch(/Investigation completed/)
    expect(b?.executiveSummary).toMatch(/reviewer validation/)
    expect(b?.evidenceSummary.map((e) => e.label)).toEqual([
      'Policy Repository reviewed',
      'Customer Timeline reviewed',
      'Financial Context reviewed',
    ])
    expect(b?.conflictSummary.map((c) => c.label)).toEqual([
      'Policy inconsistency',
      'Timeline inconsistency',
      'Financial clarification required',
    ])
    expect(b?.resolutionOptions).toHaveLength(3)
    expect(b?.aiNotes.length).toBeGreaterThanOrEqual(1)
  })

  it('holds the "presented" state through M11 (Conflict narration hold)', () => {
    const b = briefAt(300)
    expect(b?.phase).toBe('presented')
    expect(b?.subtitle).toBe('Prepared for Human Review')
  })

  it('at M12 flips to "awaiting-review" phase (Approval stage begins)', () => {
    const b = briefAt(330)
    expect(b).not.toBeNull()
    expect(b?.phase).toBe('awaiting-review')
    expect(b?.subtitle).toBe('Awaiting reviewer decision')
    // All other sections must remain stable.
    expect(b?.resolutionOptions).toHaveLength(3)
    expect(b?.evidenceSummary).toHaveLength(3)
    expect(b?.conflictSummary).toHaveLength(3)
  })

  it('holds the "awaiting-review" state through M13', () => {
    const b = briefAt(360)
    expect(b?.phase).toBe('awaiting-review')
    expect(b?.subtitle).toBe('Awaiting reviewer decision')
  })

  it('publishes three equally-weighted, neutrally-labelled resolution options in canonical order', () => {
    const b = briefAt(270)
    expect(b?.resolutionOptions.map((o) => o.optionLabel)).toEqual([
      'Option A',
      'Option B',
      'Option C',
    ])
    expect(b?.resolutionOptions.map((o) => o.title)).toEqual([
      'Request policy review',
      'Request financial verification',
      'Escalate for manual assessment',
    ])
    expect(b?.resolutionOptions.map((o) => o.id)).toEqual([
      'option-policy-review',
      'option-financial-verification',
      'option-manual-assessment',
    ])
  })

  it('never marks an option as preferred, default, recommended, or selected (shape check)', () => {
    const b = briefAt(270)
    for (const option of b?.resolutionOptions ?? []) {
      const raw = JSON.stringify(option)
      expect(raw).not.toMatch(/preferred|recommend|default|selected|highlighted|preselected/i)
    }
  })

  it('never leaks affirmative Recommendation / Approval / Refund / Compensation wording', () => {
    // "No recommendation generated" is the documented negation — allowed.
    const allowedNegations = /no recommendation generated/gi
    const forbidden =
      /recommend|approv|reject|refund granted|refund denied|compensation|resolution package|execution|customer notification|email|severity|risk|confidence|probability|root cause/i
    for (const t of [270, 300, 330, 360]) {
      const b = briefAt(t)
      const raw = [
        b?.subtitle ?? '',
        b?.executiveSummary ?? '',
        (b?.evidenceSummary ?? []).map((e) => e.label).join(' '),
        (b?.conflictSummary ?? []).map((c) => c.label).join(' '),
        (b?.resolutionOptions ?? [])
          .map((o) => `${o.optionLabel} ${o.title} ${o.description}`)
          .join(' '),
        (b?.aiNotes ?? []).join(' '),
      ].join(' ')
      const stripped = raw.replace(allowedNegations, '')
      expect(stripped).not.toMatch(forbidden)
    }
  })

  it('AI Notes explicitly communicate the absence of a recommendation', () => {
    const b = briefAt(270)
    const notes = (b?.aiNotes ?? []).join(' ')
    expect(notes).toMatch(/No recommendation generated/)
    expect(notes).toMatch(/further human review/i)
  })

  it('returns null once the runtime advances past M13 (after approval decision)', () => {
    // M13 is a wait_for_approval gate in both presenter and auto mode. Time
    // alone advances the state into `waiting_approval` at M13; an explicit
    // APPROVE action is then required to transition to the M13 continuation
    // moment (M14).
    const started = transitionRuntimeState(
      createInitialRuntimeState('auto'),
      { type: 'START' },
    )
    const waitingApproval = transitionRuntimeState(started, {
      type: 'ADVANCE_TIME',
      seconds: 390,
    })
    expect(waitingApproval.currentMomentId).toBe('M13')
    expect(waitingApproval.playbackStatus).toBe('waiting_approval')
    const approved = transitionRuntimeState(waitingApproval, { type: 'APPROVE' })
    expect(approved.currentMomentId).not.toBe('M13')
    const briefAfterDecision = selectResolutionBrief(approved)
    expect(briefAfterDecision).toBeNull()
  })
})

describe('RESOLUTION_BRIEF_PHASE_LABEL', () => {
  it('publishes the two semantic phase labels', () => {
    expect(RESOLUTION_BRIEF_PHASE_LABEL.presented).toBe('Prepared')
    expect(RESOLUTION_BRIEF_PHASE_LABEL['awaiting-review']).toBe(
      'Awaiting Review',
    )
  })
})
