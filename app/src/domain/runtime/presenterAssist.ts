import type { MomentId } from '../runtime-fixtures/types'
import type { RuntimeFocusTarget, RuntimeState, RuntimeViewModel } from './types'

export type PresenterAssistPhase =
  | 'idle'
  | 'customer_typing'
  | 'complaint_received'
  | 'evidence_revealed'
  | 'ai_acknowledgement'
  | 'intake'
  | 'complaint_analysis'
  | 'policy_validation'
  | 'workflow_preparation'
  | 'finance_recommendation'
  | 'approval_presented'
  | 'human_approval'
  | 'enterprise_approval'
  | 'customer_response'
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
    keyMessage: 'This demo shows how the AI Agentic Case Officer coordinates specialist agents through a deterministic case resolution flow.',
    talkingPoints: ['One shared runtime', 'Officer routes work to one specialist at a time', 'Human approval remains mandatory'],
    nextAction: 'Press Start',
    audienceFocus: 'Customer panel',
    whyItMatters: 'Sets expectations before the orchestration begins.',
    qaPrompts: [
      {
        question: 'Why one specialist at a time?',
        answer: 'Every handoff passes through the AI Agentic Case Officer, so each specialist output is reviewed and auditable before the next dispatch.',
      },
    ],
  },
  customer_typing: {
    stage: 'Customer typing',
    keyMessage: 'The case begins with the customer writing in Bahasa Indonesia.',
    talkingPoints: ['The customer initiates the case', 'No evidence is pre-populated', 'The same sequence runs in Presenter and Auto modes'],
    nextAction: 'Allow the complaint to appear',
    audienceFocus: 'Customer panel',
    whyItMatters: 'Preserves the customer voice before automation acts.',
    qaPrompts: [{ question: 'Is this a live customer message?', answer: 'No. This POC uses deterministic local fixture data for repeatable simulation.' }],
  },
  complaint_received: {
    stage: 'Complaint received',
    keyMessage: 'The workflow starts with the customer’s own message and attachments.',
    talkingPoints: ['Natural conversational intake', 'Customer identity is explicit', 'Attachments recorded on the case'],
    nextAction: 'Allow the attachments sequence to complete',
    audienceFocus: 'Customer panel',
    whyItMatters: 'Grounds the workflow in the customer’s reported issue.',
    qaPrompts: [{ question: 'Is customer data sent to external systems?', answer: 'This POC uses local simulated data.' }],
  },
  evidence_revealed: {
    stage: 'Attachments ingested',
    keyMessage: 'Supporting attachments are recorded on the case.',
    talkingPoints: ['Leakage photo, handover agreement, payment receipt', 'The sequence is deterministic and restart-safe'],
    nextAction: 'Wait for the Officer acknowledgement',
    audienceFocus: 'Customer evidence',
    whyItMatters: 'All evidence is present before the Officer acknowledges the customer.',
    qaPrompts: [{ question: 'Can other evidence types be supported?', answer: 'The POC demonstrates local image and document previews.' }],
  },
  ai_acknowledgement: {
    stage: 'Resolution Officer acknowledgement',
    keyMessage: 'AI Resolution Officer sends the customer acknowledgement in Bahasa Indonesia; the AI Agentic Case Officer prepared the reply after reviewing the intake.',
    talkingPoints: ['Acknowledgement follows the evidence', 'AI Resolution Officer promises daily updates', 'Investigation begins only after intake'],
    nextAction: 'Continue to the specialist dispatch',
    audienceFocus: 'AI Agentic Case Officer',
    whyItMatters: 'The customer sees a clear acknowledgement before the internal work begins.',
    qaPrompts: [{ question: 'Does the AI make the final decision here?', answer: 'No. The AI Agentic Case Officer coordinates and the AI Resolution Officer speaks to the customer; the high-impact recommendation still requires a human decision.' }],
  },
  intake: {
    stage: 'Intake',
    keyMessage: 'The complaint intake is being received.',
    talkingPoints: ['Complaint text captured', 'Attachments recorded'],
    nextAction: 'Continue to acknowledgement',
    audienceFocus: 'Customer panel',
    whyItMatters: 'Intake is complete before the Officer acknowledges.',
    qaPrompts: [{ question: 'How is confidence used?', answer: 'In this simulation it is an explainability label, not an automatic approval rule.' }],
  },
  complaint_analysis: {
    stage: 'Complaint analysis',
    keyMessage: 'The Customer Complaint Agent is analysing case evidence.',
    talkingPoints: ['Complaint text classified as High priority', 'Three attachments reviewed', 'Result returns to the AI Agentic Case Officer'],
    nextAction: 'Wait for the Complaint Analysis Package',
    audienceFocus: 'Customer Complaint Agent',
    whyItMatters: 'Structured intake reduces manual handoffs.',
    qaPrompts: [{ question: 'Why does one specialist work at a time?', answer: 'Each specialist handoff is auditable and the result is reviewed by the AI Agentic Case Officer before the next dispatch.' }],
  },
  policy_validation: {
    stage: 'Policy validation',
    keyMessage: 'The Policy Agent validates warranty coverage and contractor responsibility.',
    talkingPoints: ['Post-Handover Defect Resolution Policy retrieved', 'Coverage validated', 'Result returns to the Officer'],
    nextAction: 'Wait for the Policy Evidence Package',
    audienceFocus: 'Policy Agent',
    whyItMatters: 'Policy interpretation is a distinct auditable step.',
    qaPrompts: [{ question: 'Can policies be updated independently?', answer: 'That is a typical integration goal; this POC uses deterministic policy fixtures.' }],
  },
  workflow_preparation: {
    stage: 'Workflow preparation',
    keyMessage: 'The Workflow Agent is executing four enterprise workflow steps in order.',
    talkingPoints: ['Step 1 — Maintenance Work Order', 'Step 2 — Site Inspection Request', 'Step 3 — Vendor Assignment', 'Step 4 — Customer Update Schedule'],
    nextAction: 'Watch the workflow steps progress',
    audienceFocus: 'Workflow Agent',
    whyItMatters: 'Enterprise systems are prepared before the financial decision is finalised.',
    qaPrompts: [{ question: 'What happens if a workflow step fails?', answer: 'In this POC the four steps run cleanly; production would require retry, escalation, and idempotency rules.' }],
  },
  finance_recommendation: {
    stage: 'Financial recommendation',
    keyMessage: 'The Finance Agent is preparing the compensation recommendation.',
    talkingPoints: ['Repair estimate reviewed', 'Compensation basis validated', 'Amount kept internal until approval completes'],
    nextAction: 'Wait for the Financial Recommendation Package',
    audienceFocus: 'Finance Agent',
    whyItMatters: 'The amount stays internal until the enterprise approval workflow completes.',
    qaPrompts: [{ question: 'Can the recommendation approve itself?', answer: 'No. The presenter must approve the resolution package.' }],
  },
  approval_presented: {
    stage: 'Approval package presented',
    keyMessage: 'The Officer presents the resolution package for human approval.',
    talkingPoints: ['Four evidence packages available', 'Human decision required to start enterprise approval workflow'],
    nextAction: 'Choose Approve or Reject',
    audienceFocus: 'Approval area',
    whyItMatters: 'A single human decision starts the enterprise approval chain.',
    qaPrompts: [{ question: 'What happens after Approve?', answer: 'The four enterprise approvers each review in order in the same approval area.' }],
  },
  human_approval: {
    stage: 'Human approval',
    keyMessage: 'The system can recommend; a human must decide.',
    talkingPoints: ['Evidence packages summarised', 'Rejection risk visible', 'Auto Mode auto-approves after 10 seconds internally'],
    nextAction: 'Choose Approve or Reject',
    audienceFocus: 'Approval area',
    whyItMatters: 'Human-in-the-loop control keeps the decision accountable.',
    qaPrompts: [{ question: 'Can Auto Mode bypass human approval?', answer: 'No. Auto Mode reaches the same gate and auto-approves after 10 seconds for unattended demo.' }],
  },
  enterprise_approval: {
    stage: 'Enterprise approval workflow',
    keyMessage: 'Four enterprise approvers review the recommendation in order.',
    talkingPoints: ['Customer Service Supervisor', 'Property Operations Manager', 'Finance Controller', 'Business Unit Director'],
    nextAction: 'Watch the approver chain complete',
    audienceFocus: 'Approval area',
    whyItMatters: 'Enterprise-grade approvals happen with a single presenter click.',
    qaPrompts: [{ question: 'Are these approvals sent to real people?', answer: 'No. This POC uses deterministic sample approvers.' }],
  },
  customer_response: {
    stage: 'Customer response',
    keyMessage: 'AI Resolution Officer delivers the final Bahasa Indonesia response to the customer; the AI Agentic Case Officer prepared it after reviewing the disbursement result.',
    talkingPoints: ['Approved outcome consolidated', 'AI Resolution Officer delivers the message', 'Case closed'],
    nextAction: 'Wait for case closure',
    audienceFocus: 'Customer panel',
    whyItMatters: 'The loop closes with a clear customer-facing outcome.',
    qaPrompts: [{ question: 'Does the customer see internal amounts before approval?', answer: 'No. The amount is only disclosed after all approvals are complete.' }],
  },
  approved_final: {
    stage: 'Case resolved',
    keyMessage: 'The workflow closes with customer, operational, and preventive outcomes.',
    talkingPoints: ['Four specialist agents coordinated', 'Four workflow steps completed', 'Four approvals completed', 'Preventive control recorded'],
    nextAction: 'Review the final outcome or Restart',
    audienceFocus: 'Final outcome',
    whyItMatters: 'A strong end state connects the customer decision to operational follow-through and prevention.',
    qaPrompts: [{ question: 'Is this production-ready?', answer: 'No. This is a deterministic proof of concept for stakeholder evaluation.' }],
  },
  rejected_outcome: {
    stage: 'Rejected / escalated outcome',
    keyMessage: 'Human rejection creates a real operational consequence rather than silently continuing.',
    talkingPoints: ['Compensation remains unapproved', 'The case stays open', 'Management review is required'],
    nextAction: 'Explain escalation consequences or Restart',
    audienceFocus: 'Escalation outcome',
    whyItMatters: 'A rejected recommendation must create a safe, visible path for continued customer handling.',
    qaPrompts: [{ question: 'What happens after rejection?', answer: 'The case remains open and is assigned to management review.' }],
  },
}

const COMPLAINT_MOMENTS: readonly MomentId[] = ['M05', 'M06', 'M07']
const POLICY_MOMENTS: readonly MomentId[] = ['M10', 'M11', 'M12']
const WORKFLOW_MOMENTS: readonly MomentId[] = ['M15', 'M16', 'M17', 'M18']
const FINANCE_MOMENTS: readonly MomentId[] = ['M21', 'M22', 'M23']
const ENTERPRISE_APPROVAL_MOMENTS: readonly MomentId[] = ['M26', 'M27', 'M28', 'M29']
const CUSTOMER_RESPONSE_MOMENTS: readonly MomentId[] = ['M30', 'M31', 'M32', 'M33']

function selectPhase(state: RuntimeState, viewModel: RuntimeViewModel): PresenterAssistPhase {
  if (state.terminalOutcome === 'approved') return 'approved_final'
  if (state.terminalOutcome === 'escalated') return 'rejected_outcome'
  if (viewModel.approvalGate !== null) return 'human_approval'
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
  if (COMPLAINT_MOMENTS.includes(momentId)) return 'complaint_analysis'
  if (POLICY_MOMENTS.includes(momentId)) return 'policy_validation'
  if (WORKFLOW_MOMENTS.includes(momentId)) return 'workflow_preparation'
  if (FINANCE_MOMENTS.includes(momentId)) return 'finance_recommendation'
  if (momentId === 'M25') return 'approval_presented'
  if (ENTERPRISE_APPROVAL_MOMENTS.includes(momentId)) return 'enterprise_approval'
  if (CUSTOMER_RESPONSE_MOMENTS.includes(momentId)) return 'customer_response'
  return 'intake'
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
  if (state.playbackStatus === 'paused') return 'Paused by presenter'
  return formatRemaining(
    Math.max(0, viewModel.timer.totalSeconds - viewModel.timer.elapsedSeconds),
  )
}

function nextAction(
  content: PresenterAssistContent,
  viewModel: RuntimeViewModel,
): string {
  if (viewModel.controls.canStart) return 'Press Start'
  if (viewModel.controls.canApprove || viewModel.controls.canReject) return 'Choose Approve or Reject'
  if (viewModel.controls.canNextMoment) return 'Continue to the next moment'
  if (viewModel.controls.canResume) return 'Resume the current moment'
  return content.nextAction
}

function focusLabel(focusTarget: RuntimeFocusTarget): string | null {
  switch (focusTarget) {
    case 'customer-panel': return 'Customer panel'
    case 'officer': return 'AI Agentic Case Officer'
    case 'agent-customer-complaint': return 'Customer Complaint Agent'
    case 'agent-policy': return 'Policy Agent'
    case 'agent-workflow': return 'Workflow Agent'
    case 'agent-finance': return 'Finance Agent'
    case 'approval': return 'Approval area'
    case 'resolution': return 'Final outcome'
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
    nextAction: nextAction(content, viewModel),
    audienceFocus: focusLabel(viewModel.focusTarget) ?? content.audienceFocus,
    whyItMatters: content.whyItMatters,
    remainingTime: remainingTime(state, viewModel),
    qaPrompts: content.qaPrompts,
  }
}
