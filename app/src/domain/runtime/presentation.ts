import type { AgentId, MomentId, RuntimeStage } from '../runtime-fixtures/types'
import type {
  ApprovalGatePresentation,
  AgentLifecycleStatus,
  DecisionRationalePresentation,
  FinalOutcomePresentation,
  NowNextPresentation,
  OutcomePreviewPresentation,
  RuntimeActivityEvent,
  RuntimeFocusTarget,
  RuntimeTransitionPresentation,
} from './types'

export const OUTCOME_PREVIEW: OutcomePreviewPresentation = {
  label: 'Likely Outcome',
  items: [
    'Priority repair scheduled within 24 hours',
    'Vendor assigned via enterprise workflow',
    'Compensation credit approved for disbursement',
    'Daily customer updates confirmed',
  ],
}

export const APPROVAL_GATE_PRESENTATION: ApprovalGatePresentation = {
  recommendedAction: 'Approve the resolution package and start the enterprise approval workflow',
  why: [
    'Complaint Analysis Package: leakage confirmed, priority classified High',
    'Policy Evidence Package: warranty active, contractor responsibility identified',
    'Enterprise Workflow Package: 4 workflow steps ready to execute',
    'Financial Recommendation Package: compensation validated against budget',
  ],
  estimatedImpact: 'Compensation approved once workflow completes',
  impactQualifier: 'Amount kept internal until enterprise approval completes',
  riskIfRejected: 'Customer resolution delayed; escalation required',
  outcomePreview: OUTCOME_PREVIEW,
}

export const APPROVED_FINAL_OUTCOME: FinalOutcomePresentation = {
  type: 'approved',
  heading: 'Case Resolved',
  summary: [
    '4 of 4 specialist agents completed',
    '4 enterprise systems engaged',
    '4 workflow steps completed',
    '4 of 4 approvals completed',
    '1 human decision: Approved',
    '4 evidence packages produced',
    '11 similar cases identified',
  ],
  sections: [
    {
      heading: 'Case State',
      items: [
        'Case Resolved — completed',
        'Compensation Approved — completed',
        'Disbursement Initiated — completed',
        'Payment Completed — not reached',
      ],
    },
    {
      heading: 'Customer Outcome',
      items: [
        'Inspection scheduled within 24 hours',
        'Rp31,000,000 compensation approved',
        'Daily customer updates scheduled',
      ],
    },
    {
      heading: 'Operational Outcome',
      items: [
        'Maintenance work order submitted',
        'Vendor assignment confirmed',
        'Disbursement process initiated',
        'Customer notification completed',
      ],
    },
    {
      heading: 'Enterprise Learning',
      items: [
        '11 similar leakage cases identified',
        'Recurring handover follow-up gap detected',
        'Preventive control recommendation recorded',
      ],
    },
  ],
}

export const ESCALATED_FINAL_OUTCOME: FinalOutcomePresentation = {
  type: 'escalated',
  heading: 'Decision Rejected',
  summary: ['Human decision recorded', 'Case remains open', 'Manual escalation required'],
  sections: [
    {
      heading: 'Customer Outcome',
      items: [
        'Compensation not approved',
        'Repair request escalated for management review',
      ],
    },
    {
      heading: 'Operational Outcome',
      items: ['Case remains open', 'Manual escalation required', 'Resolution SLA at risk'],
    },
    {
      heading: 'Next Action',
      items: ['Assign senior reviewer', 'Contact customer', 'Reassess policy exception'],
    },
  ],
}

export const REJECTION_ACTIVITY_EVENT: RuntimeActivityEvent = {
  id: 'evt-human-rejection',
  time: '09:20:55',
  agent: 'Human Approver',
  action: 'Recommendation rejected',
  skill: 'Human decision',
  output: 'Escalated to senior management review',
}

export const AGENT_ORDER: readonly AgentId[] = [
  'agent-customer-complaint',
  'agent-policy',
  'agent-workflow',
  'agent-finance',
]

type LifecycleByAgent = Readonly<Record<AgentId, AgentLifecycleStatus>>

const WAITING_LIFECYCLE: LifecycleByAgent = {
  'agent-customer-complaint': 'waiting',
  'agent-policy': 'waiting',
  'agent-workflow': 'waiting',
  'agent-finance': 'waiting',
}

function lifecycle(
  customer: AgentLifecycleStatus,
  policy: AgentLifecycleStatus,
  workflow: AgentLifecycleStatus,
  finance: AgentLifecycleStatus,
): LifecycleByAgent {
  return {
    'agent-customer-complaint': customer,
    'agent-policy': policy,
    'agent-workflow': workflow,
    'agent-finance': finance,
  }
}

export const LIFECYCLE_BY_MOMENT: Readonly<Record<MomentId, LifecycleByAgent>> = {
  M01: WAITING_LIFECYCLE,
  M02: WAITING_LIFECYCLE,
  M03: WAITING_LIFECYCLE,
  // Complaint Agent — single activation spanning Milestone A (M04–M06) and
  // Milestone B (M07 needs_review, M08 returns to Officer as completed).
  M04: lifecycle('working', 'waiting', 'waiting', 'waiting'),
  M05: lifecycle('working', 'waiting', 'waiting', 'waiting'),
  M06: lifecycle('working', 'waiting', 'waiting', 'waiting'),
  M07: lifecycle('needs_review', 'waiting', 'waiting', 'waiting'),
  M08: lifecycle('completed', 'waiting', 'waiting', 'waiting'),
  // Policy Agent.
  M09: lifecycle('completed', 'working', 'waiting', 'waiting'),
  M10: lifecycle('completed', 'working', 'waiting', 'waiting'),
  M11: lifecycle('completed', 'working', 'waiting', 'waiting'),
  M12: lifecycle('completed', 'needs_review', 'waiting', 'waiting'),
  M13: lifecycle('completed', 'completed', 'waiting', 'waiting'),
  // Workflow first activation — blue during M14–M17, needs_review M18,
  // returns at M19. From M19 onward Workflow enters the orange
  // "Workflow Ready — Waiting for Finance Recommendation" state and stays
  // orange through Finance's calculation (M20–M24).
  M14: lifecycle('completed', 'completed', 'working', 'waiting'),
  M15: lifecycle('completed', 'completed', 'working', 'waiting'),
  M16: lifecycle('completed', 'completed', 'working', 'waiting'),
  M17: lifecycle('completed', 'completed', 'working', 'waiting'),
  M18: lifecycle('completed', 'completed', 'needs_review', 'waiting'),
  M19: lifecycle('completed', 'completed', 'awaiting_approval', 'waiting'),
  M20: lifecycle('completed', 'completed', 'awaiting_approval', 'working'),
  M21: lifecycle('completed', 'completed', 'awaiting_approval', 'working'),
  M22: lifecycle('completed', 'completed', 'awaiting_approval', 'working'),
  M23: lifecycle(
    'completed',
    'completed',
    'awaiting_approval',
    'awaiting_approval',
  ),
  M24: lifecycle(
    'completed',
    'completed',
    'awaiting_approval',
    'awaiting_approval',
  ),
  // Workflow reactivation for approval routing — blue while preparing the
  // approval package at M25, then orange again while the four-approver
  // chain runs (M26–M28). Turns green at M29 when approver 4 completes.
  M25: lifecycle(
    'completed',
    'completed',
    'working',
    'awaiting_approval',
  ),
  M26: lifecycle(
    'completed',
    'completed',
    'awaiting_approval',
    'awaiting_approval',
  ),
  M27: lifecycle(
    'completed',
    'completed',
    'awaiting_approval',
    'awaiting_approval',
  ),
  M28: lifecycle(
    'completed',
    'completed',
    'awaiting_approval',
    'awaiting_approval',
  ),
  M29: lifecycle('completed', 'completed', 'completed', 'awaiting_approval'),
  // Finance reactivation for disbursement — Preparing Disbursement (blue)
  // at M30, Disbursement Initiated (green) from M31 onward.
  M30: lifecycle('completed', 'completed', 'completed', 'working'),
  M31: lifecycle('completed', 'completed', 'completed', 'completed'),
  M32: lifecycle('completed', 'completed', 'completed', 'completed'),
  M33: lifecycle('completed', 'completed', 'completed', 'completed'),
}

export function lifecycleForMoment(momentId: MomentId | null): LifecycleByAgent {
  return momentId === null ? WAITING_LIFECYCLE : LIFECYCLE_BY_MOMENT[momentId]
}

export const NOW_NEXT_BY_STAGE: Readonly<Record<RuntimeStage, NowNextPresentation>> = {
  Intake: {
    now: 'Reading complaint and attachments',
    next: 'Officer acknowledges customer',
  },
  Investigation: {
    now: 'Specialist review orchestrated by AI Agentic Case Officer',
    next: 'Prepare workflow package',
  },
  Workflow: {
    now: 'Preparing enterprise workflow',
    next: 'Human approval',
  },
  Approval: {
    now: 'Awaiting human decision',
    next: 'Enterprise approval workflow',
  },
  Resolution: {
    now: 'Finalising customer response',
    next: 'Close case',
  },
}

const OFFICER_FOCUS: RuntimeFocusTarget = 'officer'

export const FOCUS_BY_MOMENT: Readonly<Record<MomentId, RuntimeFocusTarget>> = {
  M01: 'customer-panel',
  M02: 'customer-panel',
  M03: OFFICER_FOCUS,
  M04: OFFICER_FOCUS,
  M05: 'agent-customer-complaint',
  M06: 'agent-customer-complaint',
  M07: 'agent-customer-complaint',
  M08: OFFICER_FOCUS,
  M09: OFFICER_FOCUS,
  M10: 'agent-policy',
  M11: 'agent-policy',
  M12: 'agent-policy',
  M13: OFFICER_FOCUS,
  M14: OFFICER_FOCUS,
  M15: 'agent-workflow',
  M16: 'agent-workflow',
  M17: 'agent-workflow',
  M18: 'agent-workflow',
  M19: OFFICER_FOCUS,
  M20: OFFICER_FOCUS,
  M21: 'agent-finance',
  M22: 'agent-finance',
  M23: 'agent-finance',
  M24: OFFICER_FOCUS,
  M25: 'approval',
  M26: 'approval',
  M27: 'approval',
  M28: 'approval',
  M29: 'approval',
  M30: 'agent-finance',
  M31: 'agent-finance',
  M32: 'resolution',
  M33: 'resolution',
}

const OFFICER_PREPARING_COMPLAINT: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'working',
  title: 'Preparing complaint analysis',
  bullets: [
    'Structured complaint analysis is required before policy or workflow can begin.',
  ],
}

const OFFICER_REVIEWING_COMPLAINT: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'result',
  title: 'Reviewing complaint analysis',
  bullets: [
    'Policy validation is required before operational remediation can proceed.',
  ],
}

const OFFICER_PREPARING_POLICY: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'working',
  title: 'Preparing policy validation',
  bullets: [
    'Warranty coverage and contractor responsibility must be confirmed before workflow steps can be built.',
  ],
}

const OFFICER_REVIEWING_POLICY: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'result',
  title: 'Reviewing policy outcome',
  bullets: [
    'Enterprise workflow depends on validated policy coverage.',
  ],
}

const OFFICER_PREPARING_WORKFLOW: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'working',
  title: 'Preparing operational workflow',
  bullets: [
    'Operational remediation can now proceed with validated coverage in place.',
  ],
}

const OFFICER_REVIEWING_WORKFLOW: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'result',
  title: 'Reviewing workflow package',
  bullets: [
    'Financial recommendation requires validated workflow readiness.',
  ],
}

const OFFICER_PREPARING_FINANCE: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'working',
  title: 'Preparing financial recommendation',
  bullets: [
    'Compensation must be validated against budget before enterprise approval.',
  ],
}

const OFFICER_REVIEWING_FINANCE: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'result',
  title: 'Reviewing compensation recommendation',
  bullets: [
    'The compensation recommendation is ready to be included in the enterprise approval package.',
  ],
}

const COMPLAINT_WORKING: DecisionRationalePresentation = {
  agentId: 'agent-customer-complaint',
  state: 'working',
  title: 'Analysing complaint',
  bullets: ['Reading the complaint text', 'Reviewing three supporting attachments'],
}

const COMPLAINT_RESULT: DecisionRationalePresentation = {
  agentId: 'agent-customer-complaint',
  state: 'result',
  title: 'Complaint Analysis Package ready',
  bullets: ['Leakage confirmed', 'Priority classified High'],
}

const POLICY_WORKING: DecisionRationalePresentation = {
  agentId: 'agent-policy',
  state: 'working',
  title: 'Checking policy coverage',
  bullets: ['Retrieving Post-Handover Defect Resolution Policy'],
}

const POLICY_RESULT: DecisionRationalePresentation = {
  agentId: 'agent-policy',
  state: 'result',
  title: 'Policy Evidence Package ready',
  bullets: ['Warranty active', 'Contractor responsibility identified'],
}

const WORKFLOW_WORKING: DecisionRationalePresentation = {
  agentId: 'agent-workflow',
  state: 'working',
  title: 'Preparing enterprise workflow',
  bullets: ['Submitting workflow steps to SAP CX'],
}

const WORKFLOW_RESULT: DecisionRationalePresentation = {
  agentId: 'agent-workflow',
  state: 'result',
  title: 'Enterprise Workflow Package ready',
  bullets: ['All 4 workflow steps submitted'],
}

const FINANCE_WORKING: DecisionRationalePresentation = {
  agentId: 'agent-finance',
  state: 'working',
  title: 'Preparing financial recommendation',
  bullets: ['Reviewing repair estimate', 'Validating compensation basis'],
}

const FINANCE_RESULT: DecisionRationalePresentation = {
  agentId: 'agent-finance',
  state: 'result',
  title: 'Financial Recommendation Package ready',
  bullets: ['Compensation validated', 'Ready for approval'],
}

const APPROVAL_PRESENT: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'working',
  title: 'Preparing enterprise approval',
  bullets: [
    'A single human decision authorises the enterprise approval workflow.',
  ],
}

const APPROVAL_STEP: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'working',
  title: 'Enterprise approval workflow running',
  bullets: ['Enterprise approvers are reviewing the recommendation in order.'],
}

const APPROVAL_COMPLETE: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'result',
  title: 'Reviewing enterprise approval',
  bullets: [
    'All four approvals are complete, so Finance can begin disbursement preparation.',
  ],
}

const CUSTOMER_INTAKE: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'working',
  title: 'Complaint intake in progress',
  bullets: ['Receiving complaint and attachments'],
}

const OFFICER_ACKNOWLEDGE: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'result',
  title: 'Acknowledgement composed',
  bullets: [
    'Confirms receipt of the complaint',
    'Promises daily updates in Bahasa Indonesia',
  ],
}

const OFFICER_FINALISE: DecisionRationalePresentation = {
  agentId: 'officer',
  state: 'result',
  title: 'Preparing final customer response',
  bullets: [
    'The Bahasa response consolidates the approved outcome for delivery by AI Resolution Officer.',
  ],
}

const FINANCE_PREPARING_DISBURSEMENT: DecisionRationalePresentation = {
  agentId: 'agent-finance',
  state: 'working',
  title: 'Preparing compensation disbursement',
  bullets: [
    'Disbursement can only be initiated once enterprise approval is complete.',
    'Compensation Rp31.000.000 queued for release.',
  ],
}

const FINANCE_DISBURSEMENT_INITIATED: DecisionRationalePresentation = {
  agentId: 'agent-finance',
  state: 'result',
  title: 'Disbursement initiated',
  bullets: [
    'Confirmation returned to AI Agentic Case Officer; the customer response can now be prepared.',
  ],
}

export const RATIONALE_BY_MOMENT: Readonly<
  Record<MomentId, DecisionRationalePresentation>
> = {
  M01: CUSTOMER_INTAKE,
  M02: CUSTOMER_INTAKE,
  M03: OFFICER_ACKNOWLEDGE,
  M04: OFFICER_PREPARING_COMPLAINT,
  M05: COMPLAINT_WORKING,
  M06: COMPLAINT_WORKING,
  M07: COMPLAINT_RESULT,
  M08: OFFICER_REVIEWING_COMPLAINT,
  M09: OFFICER_PREPARING_POLICY,
  M10: POLICY_WORKING,
  M11: POLICY_WORKING,
  M12: POLICY_RESULT,
  M13: OFFICER_REVIEWING_POLICY,
  M14: OFFICER_PREPARING_WORKFLOW,
  M15: WORKFLOW_WORKING,
  M16: WORKFLOW_WORKING,
  M17: WORKFLOW_WORKING,
  M18: WORKFLOW_RESULT,
  M19: OFFICER_REVIEWING_WORKFLOW,
  M20: OFFICER_PREPARING_FINANCE,
  M21: FINANCE_WORKING,
  M22: FINANCE_WORKING,
  M23: FINANCE_RESULT,
  M24: OFFICER_REVIEWING_FINANCE,
  M25: APPROVAL_PRESENT,
  M26: APPROVAL_STEP,
  M27: APPROVAL_STEP,
  M28: APPROVAL_STEP,
  M29: APPROVAL_COMPLETE,
  M30: FINANCE_PREPARING_DISBURSEMENT,
  M31: FINANCE_DISBURSEMENT_INITIATED,
  M32: OFFICER_FINALISE,
  M33: OFFICER_FINALISE,
}

export const TRANSITION_BY_MOMENT: Partial<
  Readonly<Record<MomentId, RuntimeTransitionPresentation>>
> = {
  M03: {
    title: 'Intake reviewed',
    next: 'Preparing complaint analysis',
  },
  M05: {
    title: 'Initial complaint findings reviewed',
    next: 'Preparing acknowledgement',
  },
  M08: {
    title: 'Complaint analysis received',
    next: 'Preparing policy validation',
  },
  M13: {
    title: 'Policy outcome received',
    next: 'Preparing operational workflow',
  },
  M19: {
    title: 'Workflow package received',
    next: 'Preparing financial recommendation',
  },
  M24: {
    title: 'Compensation recommendation received',
    next: 'Preparing enterprise approval',
  },
  M25: {
    title: 'Approval package routed via Workflow Agent',
    next: 'Awaiting human approval',
  },
  M29: {
    title: 'Enterprise approval reviewed',
    next: 'Preparing compensation disbursement',
  },
  M30: {
    title: 'Finance Agent reactivated',
    next: 'Awaiting disbursement confirmation',
  },
  M31: {
    title: 'Disbursement result reviewed',
    next: 'Preparing final customer response',
  },
  M32: {
    title: 'Final customer response prepared',
    next: 'Delivered by AI Resolution Officer',
  },
}
