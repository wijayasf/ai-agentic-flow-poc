import type { RuntimeState } from '../../domain/runtime'

/**
 * Approval Package presentation — surfaces the four evidence packages that
 * the Officer bundled together before the human approval gate. No numeric
 * amount is disclosed here.
 */

export type ResolutionBriefPhase = 'presented' | 'awaiting-review'

export interface EvidenceSummaryItem {
  readonly id: string
  readonly label: string
}

export interface ResolutionBriefViewModel {
  readonly phase: ResolutionBriefPhase
  readonly subtitle: string
  readonly executiveSummary: string
  readonly evidenceSummary: readonly EvidenceSummaryItem[]
  readonly aiNotes: readonly string[]
}

const SUBTITLE_PRESENTED = 'Approval package prepared'
const SUBTITLE_AWAITING = 'Awaiting reviewer decision'

const EXECUTIVE_SUMMARY =
  'Four evidence packages assembled by the AI Agentic Case Officer. Human decision required to start the enterprise approval workflow.'

const EVIDENCE_SUMMARY: readonly EvidenceSummaryItem[] = [
  { id: 'complaint', label: 'Complaint Analysis Package' },
  { id: 'policy', label: 'Policy Evidence Package' },
  { id: 'workflow', label: 'Enterprise Workflow Package' },
  { id: 'finance', label: 'Financial Recommendation Package' },
]

const AI_NOTES: readonly string[] = [
  'All specialist evidence complete.',
  'Compensation amount kept internal until enterprise approval completes.',
]

export function selectResolutionBrief(
  state: RuntimeState,
): ResolutionBriefViewModel | null {
  const moment = state.currentMomentId
  if (moment === 'M24') {
    return buildViewModel('presented')
  }
  if (moment === 'M25') {
    return buildViewModel('awaiting-review')
  }
  return null
}

function buildViewModel(phase: ResolutionBriefPhase): ResolutionBriefViewModel {
  return {
    phase,
    subtitle: phase === 'presented' ? SUBTITLE_PRESENTED : SUBTITLE_AWAITING,
    executiveSummary: EXECUTIVE_SUMMARY,
    evidenceSummary: EVIDENCE_SUMMARY,
    aiNotes: AI_NOTES,
  }
}

export const RESOLUTION_BRIEF_PHASE_LABEL: Readonly<
  Record<ResolutionBriefPhase, string>
> = {
  presented: 'Prepared',
  'awaiting-review': 'Awaiting Review',
}
