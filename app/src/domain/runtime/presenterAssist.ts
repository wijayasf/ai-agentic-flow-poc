import type { MomentId } from '../runtime-fixtures/types'
import type { RuntimeFocusTarget, RuntimeState, RuntimeViewModel } from './types'

export type PresenterAssistPhase =
  | 'idle'
  | 'customer_typing'
  | 'complaint_received'
  | 'evidence_revealed'
  | 'ai_acknowledgement'
  | 'intake'
  | 'policy_validation'
  | 'investigation'
  | 'conflict_detection'
  | 'recommendation_preparation'
  | 'human_approval'
  | 'approved_processing'
  | 'failure'
  | 'recovery'
  | 'learning'
  | 'approved_final'
  | 'rejected_outcome'

export interface PresenterAssistQAPrompt {
  readonly question: string
  readonly answer: string
}

export interface PresenterAssistModel {
  readonly phase: PresenterAssistPhase
  readonly stage: string
  readonly keyMessage: string
  readonly talkingPoints: readonly string[]
  readonly nextAction: string
  readonly audienceFocus: string
  readonly whyItMatters: string
  readonly remainingTime: string
  readonly qaPrompts: readonly PresenterAssistQAPrompt[]
}

interface PresenterAssistContent {
  readonly stage: string
  readonly keyMessage: string
  readonly talkingPoints: readonly string[]
  readonly nextAction: string
  readonly audienceFocus: string
  readonly whyItMatters: string
  readonly qaPrompts: readonly PresenterAssistQAPrompt[]
}

const CONTENT: Readonly<Record<PresenterAssistPhase, PresenterAssistContent>> = {
  idle: {
    stage: 'Idle',
    keyMessage: 'This demo shows how specialized AI agents collaborate across a controlled enterprise workflow.',
    talkingPoints: ['One shared runtime', 'Human approval remains mandatory', 'Evidence and system activity are visible'],
    nextAction: 'Press Start',
    audienceFocus: 'Customer Story panel',
    whyItMatters: 'Sets expectations before automation begins.',
    qaPrompts: [
      {
        question: 'Why are multiple agents used instead of one model?',
        answer: 'Each simulated agent has a defined responsibility, making handoffs, evidence, and accountability easier to explain and govern.',
      },
      {
        question: 'Are token savings measured?',
        answer: 'Token reduction is not yet proven without a measured baseline.',
      },
    ],
  },
  customer_typing: {
    stage: 'Customer typing',
    keyMessage: 'The experience begins with a natural customer interaction, before any agent investigation starts.',
    talkingPoints: ['The customer initiates the case', 'No evidence is pre-populated', 'The same sequence runs in Presenter and Auto modes'],
    nextAction: 'Allow the customer message to appear',
    audienceFocus: 'Customer Story',
    whyItMatters: 'A clear intake boundary prevents automation from acting without customer context.',
    qaPrompts: [{ question: 'Is this a live customer message?', answer: 'No. This POC uses deterministic local fixture data for a repeatable simulation.' }],
  },
  complaint_received: {
    stage: 'Complaint received',
    keyMessage: 'The workflow starts with the customer’s own message and identity.',
    talkingPoints: ['Natural conversational intake', 'Customer identity is explicit', 'Agent work waits for usable context'],
    nextAction: 'Allow the evidence sequence to begin',
    audienceFocus: 'Customer Story',
    whyItMatters: 'Preserving the customer’s language helps the workflow remain grounded in the reported issue.',
    qaPrompts: [{ question: 'Is customer data sent to external systems?', answer: 'This POC uses local simulated data. Production data movement would require an approved integration and governance design.' }],
  },
  evidence_revealed: {
    stage: 'Evidence revealed',
    keyMessage: 'Supporting evidence appears progressively and remains tied to the customer complaint.',
    talkingPoints: ['Leakage photo appears first', 'Agreement and receipt follow', 'The sequence is deterministic and restart-safe'],
    nextAction: 'Allow all three attachments to appear',
    audienceFocus: 'Customer evidence',
    whyItMatters: 'Evidence should be available before agents form a recommendation.',
    qaPrompts: [{ question: 'Can other evidence types be supported?', answer: 'The POC demonstrates local image and document previews; production formats would depend on approved ingestion capabilities.' }],
  },
  ai_acknowledgement: {
    stage: 'AI acknowledgement',
    keyMessage: 'The AI Resolution Officer acknowledges the case before handing it into the specialist workflow.',
    talkingPoints: ['The acknowledgement follows the evidence', 'The response sets a service expectation', 'Investigation begins only after intake'],
    nextAction: 'Allow the specialist workflow to begin',
    audienceFocus: 'AI Resolution Officer response',
    whyItMatters: 'A clear acknowledgement gives the customer confidence that the case was understood and routed.',
    qaPrompts: [{ question: 'Does the AI make the final decision here?', answer: 'No. It acknowledges and coordinates; the high-impact recommendation still requires a human decision.' }],
  },
  intake: {
    stage: 'Intake',
    keyMessage: 'The Customer Complaint Agent is structuring the complaint and validating the submitted evidence.',
    talkingPoints: ['Complaint facts are normalized', 'Three attachments are reviewed', 'Confidence is labeled as simulated'],
    nextAction: 'Narrate the Customer Complaint Agent',
    audienceFocus: 'Customer Complaint Agent',
    whyItMatters: 'Structured intake reduces manual handoffs and gives later agents a consistent evidence package.',
    qaPrompts: [{ question: 'How is confidence used?', answer: 'In this simulation it is an explainability label, not a production threshold or automatic approval rule.' }],
  },
  policy_validation: {
    stage: 'Policy validation',
    keyMessage: 'The Policy Agent matches verified complaint facts against the relevant warranty policy.',
    talkingPoints: ['Policy retrieval is a separate responsibility', 'Eligibility remains visible', 'Manager approval requirements are surfaced'],
    nextAction: 'Wait for the Policy Agent result',
    audienceFocus: 'Policy Agent and policy evidence',
    whyItMatters: 'Separating policy interpretation makes the recommendation easier to audit and update.',
    qaPrompts: [{ question: 'Can policies be updated independently?', answer: 'That is a typical integration goal, but this POC uses deterministic policy fixtures rather than a production repository.' }],
  },
  investigation: {
    stage: 'Investigation',
    keyMessage: 'Specialist agents are comparing verified evidence with enterprise records.',
    talkingPoints: ['Evidence and system status are checked separately', 'Agent ownership remains sequential', 'Activity is visible in the trace'],
    nextAction: 'Narrate the active agent',
    audienceFocus: 'Active Agent and enterprise systems',
    whyItMatters: 'Cross-system verification normally requires coordination across multiple teams.',
    qaPrompts: [{ question: 'Can this integrate with existing enterprise tools?', answer: 'The flow is designed to illustrate that pattern; real integrations, permissions, and error handling are outside this POC.' }],
  },
  conflict_detection: {
    stage: 'Conflict detection',
    keyMessage: 'The agents found a mismatch between enterprise status and customer evidence.',
    talkingPoints: ['SAP CX reports completion', 'Customer evidence indicates the issue remains unresolved', 'The workflow does not silently trust one source'],
    nextAction: 'Explain how the Workflow Agent prepares the conflict for resolution',
    audienceFocus: 'Workflow Agent and system status',
    whyItMatters: 'Explicit conflict handling prevents a misleading system status from prematurely closing the case.',
    qaPrompts: [{ question: 'What happens when enterprise systems disagree?', answer: 'The conflict is surfaced as evidence for resolution and human review instead of being silently overwritten.' }],
  },
  recommendation_preparation: {
    stage: 'Recommendation preparation',
    keyMessage: 'The Finance Agent is assembling a draft resolution from verified evidence, policy, and system findings.',
    talkingPoints: ['The outcome remains a draft', 'Impact is labeled as a simulated estimate', 'Human approval is prepared, not bypassed'],
    nextAction: 'Wait for the approval recommendation',
    audienceFocus: 'Finance Agent and draft recommendation',
    whyItMatters: 'Decision-ready summaries reduce review effort without hiding the evidence behind them.',
    qaPrompts: [{ question: 'Can the recommendation approve itself?', answer: 'No. Both Presenter and Auto modes stop at the explicit human approval gate.' }],
  },
  human_approval: {
    stage: 'Human approval',
    keyMessage: 'The system can recommend, but a human must decide.',
    talkingPoints: ['Evidence is summarized', 'Impact is shown as a simulated estimate', 'Rejection risk is visible', 'Auto Mode auto-approves after 10 seconds'],
    nextAction: 'Choose Approve or Reject',
    audienceFocus: 'Approval Card',
    whyItMatters: 'Human-in-the-loop control keeps a consequential customer and financial decision accountable.',
    qaPrompts: [{ question: 'Can Auto Mode bypass human approval?', answer: 'No. Auto Mode reaches the same gate and auto-approves after 10 seconds to allow unattended demonstration; Presenter Mode requires an explicit human decision.' }],
  },
  approved_processing: {
    stage: 'Approved processing',
    keyMessage: 'The approved decision is being converted into operational and customer-resolution actions.',
    talkingPoints: ['Human decision is recorded', 'Approved artifacts are generated progressively', 'Failure and recovery remain observable'],
    nextAction: 'Narrate resolution package processing',
    audienceFocus: 'Finance Agent and resolution artifacts',
    whyItMatters: 'Approval is not the end of the workflow; downstream execution still needs traceability.',
    qaPrompts: [{ question: 'Is the financial posting real?', answer: 'No. Posting and recovery are deterministic simulation events in this POC.' }],
  },
  failure: {
    stage: 'Failure',
    keyMessage: 'The assigned contractor has rejected the task, and the rejection is visible rather than hidden.',
    talkingPoints: ['The Workflow Agent is blocked', 'The rejection code is simulated', 'Recovery reroutes to an alternative contractor'],
    nextAction: 'Explain the rerouting recovery path',
    audienceFocus: 'Workflow Agent and failure status',
    whyItMatters: 'Operational resilience requires contractor rejections to be observable, actionable, and recoverable.',
    qaPrompts: [{ question: 'Does the POC retry indefinitely?', answer: 'No. It follows a deterministic recovery scenario so the behavior remains explainable and testable.' }],
  },
  recovery: {
    stage: 'Recovery',
    keyMessage: 'The Workflow Agent is rerouting the repair task to an alternative contractor.',
    talkingPoints: ['Completed evidence remains preserved', 'Only the blocked task assignment is recovered', 'The trace records the rerouting'],
    nextAction: 'Allow rerouting to complete',
    audienceFocus: 'Workflow Agent and recovery trace',
    whyItMatters: 'Targeted recovery avoids restarting completed work or losing the human decision.',
    qaPrompts: [{ question: 'Would production recovery be identical?', answer: 'Not necessarily. Production retry, idempotency, and escalation rules would be designed for the connected systems.' }],
  },
  learning: {
    stage: 'Learning',
    keyMessage: 'One resolved case becomes reusable enterprise learning.',
    talkingPoints: [
      'Customer resolved and communication is scheduled',
      '11 similar cases identified — same recurring SAP CX control gap',
      'Preventive control recommendation is ready for the team',
      'Continue to close the workflow',
    ],
    nextAction: 'Continue to complete the workflow',
    audienceFocus: 'Final Outcome',
    whyItMatters: 'Closing the loop from customer resolution to systemic prevention is the highest-value output of the agentic workflow.',
    qaPrompts: [
      {
        question: 'Is this pattern detection automated?',
        answer: 'In this POC the pattern is deterministic. Production would require similarity scoring and case cluster analysis.',
      },
    ],
  },
  approved_final: {
    stage: 'Approved final state',
    keyMessage: 'The workflow closes with customer, operational, and preventive outcomes.',
    talkingPoints: ['Four agents collaborated', 'Enterprise sources were checked', 'A conflict and human decision were recorded', 'Preventive action was created'],
    nextAction: 'Review the final outcome or Restart',
    audienceFocus: 'Final Outcome',
    whyItMatters: 'A strong end state connects the customer decision to operational follow-through and prevention.',
    qaPrompts: [{ question: 'Is this production-ready?', answer: 'No. This is a deterministic proof of concept for stakeholder evaluation, not a production deployment.' }],
  },
  rejected_outcome: {
    stage: 'Rejected / escalated outcome',
    keyMessage: 'Human rejection creates a real operational consequence rather than silently continuing.',
    talkingPoints: ['Compensation remains unapproved', 'The case stays open', 'Management review is required', 'Finance becomes blocked'],
    nextAction: 'Explain escalation consequences or Restart',
    audienceFocus: 'Escalation outcome',
    whyItMatters: 'A rejected recommendation must create a safe, visible path for continued customer handling.',
    qaPrompts: [{ question: 'What happens after rejection?', answer: 'The case remains open and is assigned to management review; approved compensation artifacts are not produced.' }],
  },
}

const POLICY_MOMENTS: readonly MomentId[] = ['M04', 'M05']
const INVESTIGATION_MOMENTS: readonly MomentId[] = ['M06', 'M07', 'M08']
const CONFLICT_MOMENTS: readonly MomentId[] = ['M09', 'M10', 'M11']
const RECOVERY_MOMENTS: readonly MomentId[] = ['M17', 'M18']

function selectPhase(state: RuntimeState, viewModel: RuntimeViewModel): PresenterAssistPhase {
  if (state.terminalOutcome === 'approved') return 'approved_final'
  if (state.terminalOutcome === 'escalated') return 'rejected_outcome'
  if (state.playbackStatus === 'failed') return 'failure'
  if (
    state.playbackStatus === 'recovering' ||
    (viewModel.currentMoment !== null && RECOVERY_MOMENTS.includes(viewModel.currentMoment.id))
  ) return 'recovery'
  if (viewModel.approvalGate !== null) return 'human_approval'
  if (
    state.playbackStatus === 'paused' &&
    viewModel.currentMoment?.id === 'M20'
  ) return 'learning'
  if (state.approvalStatus === 'approved') return 'approved_processing'
  if (viewModel.earlyStory.isIdle) return 'idle'
  if (viewModel.earlyStory.phase === 'customer_typing') return 'customer_typing'
  if (
    viewModel.earlyStory.phase === 'customer_identity' ||
    viewModel.earlyStory.phase === 'customer_message'
  ) return 'complaint_received'
  if (
    viewModel.earlyStory.phase === 'leakage_photo' ||
    viewModel.earlyStory.phase === 'handover_agreement' ||
    viewModel.earlyStory.phase === 'payment_receipt'
  ) return 'evidence_revealed'
  if (
    viewModel.earlyStory.phase === 'ai_typing' ||
    (viewModel.earlyStory.phase === 'acknowledged' && viewModel.earlyStory.showIntakeContext)
  ) return 'ai_acknowledgement'

  const momentId = viewModel.currentMoment?.id
  if (momentId === undefined || momentId === 'M01' || momentId === 'M02' || momentId === 'M03') return 'intake'
  if (POLICY_MOMENTS.includes(momentId)) return 'policy_validation'
  if (INVESTIGATION_MOMENTS.includes(momentId)) return 'investigation'
  if (CONFLICT_MOMENTS.includes(momentId)) return 'conflict_detection'
  if (momentId === 'M12' || momentId === 'M13') return 'recommendation_preparation'
  return 'approved_processing'
}

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')} simulated remaining`
}

function remainingTime(state: RuntimeState, viewModel: RuntimeViewModel): string {
  if (state.terminalOutcome === 'approved') return 'Complete'
  if (state.terminalOutcome === 'escalated') return 'Escalated'
  if (viewModel.approvalGate !== null) return 'Paused for human decision'
  if (state.playbackStatus === 'waiting_failure_injection') {
    return 'Paused for presenter action'
  }
  if (state.playbackStatus === 'paused') return 'Paused by presenter'
  return formatRemaining(
    Math.max(0, viewModel.timer.totalSeconds - viewModel.timer.elapsedSeconds),
  )
}

function nextAction(
  content: PresenterAssistContent,
  viewModel: RuntimeViewModel,
  phase: PresenterAssistPhase,
): string {
  if (viewModel.controls.canStart) return 'Press Start'
  if (viewModel.controls.canApprove || viewModel.controls.canReject) return 'Choose Approve or Reject'
  if (viewModel.controls.canInjectFailure) return 'Inject the contractor rejection'
  if (phase === 'learning') return content.nextAction
  if (viewModel.controls.canNextMoment) return 'Continue to the next moment'
  if (viewModel.controls.canResume) return 'Resume the current moment'
  return content.nextAction
}

function focusLabel(focusTarget: RuntimeFocusTarget): string | null {
  switch (focusTarget) {
    case 'customer-panel': return 'Customer Story'
    case 'agent-customer-complaint': return 'Customer Complaint Agent'
    case 'agent-policy': return 'Policy Agent and policy evidence'
    case 'agent-workflow': return 'Workflow Agent and system status'
    case 'agent-finance': return 'Finance Agent and recommendation'
    case 'approval': return 'Approval Card'
    case 'resolution': return 'Final Outcome'
    case null: return null
    default: return focusTarget satisfies never
  }
}

export function selectPresenterAssist(
  state: RuntimeState,
  viewModel: RuntimeViewModel,
): PresenterAssistModel {
  const phase = selectPhase(state, viewModel)
  const content = CONTENT[phase]
  return {
    phase,
    stage: content.stage,
    keyMessage: content.keyMessage,
    talkingPoints: content.talkingPoints,
    nextAction: nextAction(content, viewModel, phase),
    audienceFocus: focusLabel(viewModel.focusTarget) ?? content.audienceFocus,
    whyItMatters: content.whyItMatters,
    remainingTime: remainingTime(state, viewModel),
    qaPrompts: content.qaPrompts,
  }
}
