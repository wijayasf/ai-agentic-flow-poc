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
    'Reopen SAP CX ticket and schedule inspection within 24 hours',
    'Assign alternative contractor',
    'Create Rp31 million compensation credit memo',
    'Send daily customer updates',
  ],
}

export const APPROVAL_GATE_PRESENTATION: ApprovalGatePresentation = {
  recommendedAction: 'Reopen SAP CX case and schedule urgent inspection',
  why: [
    'Handover Clause 8.2 and Defect Policy 4.1 require resolution',
    'SAP CX status conflicts with customer-confirmed evidence',
    'Customer Care Director approval required for Rp31 million compensation',
  ],
  estimatedImpact: 'Rp31,000,000',
  impactQualifier: 'Approved per financial calculation (Finance Agent)',
  riskIfRejected: 'High customer and reputational risk',
  outcomePreview: OUTCOME_PREVIEW,
}

export const APPROVED_FINAL_OUTCOME: FinalOutcomePresentation = {
  type: 'approved',
  heading: 'Case Resolved',
  summary: [
    '4 agents collaborated',
    '4 enterprise systems engaged',
    '1 conflict detected and resolved',
    '1 human decision: Approved',
    '4 artifacts produced',
    '11 similar cases identified',
  ],
  sections: [
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
        'SAP CX ticket reopened',
        'Customer confirmation required before closure',
      ],
    },
    {
      heading: 'Enterprise Learning',
      items: [
        '11 similar cases — recurring SAP CX control gap',
        'Preventive control: mandatory customer confirmation before SAP CX closure',
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
  time: '09:19:20',
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
  M01: lifecycle('working', 'waiting', 'waiting', 'waiting'),
  M02: lifecycle('working', 'waiting', 'waiting', 'waiting'),
  M03: lifecycle('completed', 'waiting', 'waiting', 'waiting'),
  M04: lifecycle('completed', 'working', 'working', 'working'),
  M05: lifecycle('completed', 'completed', 'working', 'working'),
  M06: lifecycle('completed', 'completed', 'completed', 'working'),
  M07: lifecycle('completed', 'completed', 'completed', 'completed'),
  M08: lifecycle('completed', 'completed', 'completed', 'completed'),
  M09: lifecycle('completed', 'completed', 'working', 'waiting'),
  M10: lifecycle('completed', 'completed', 'working', 'waiting'),
  M11: lifecycle('completed', 'completed', 'completed', 'waiting'),
  M12: lifecycle('completed', 'completed', 'completed', 'working'),
  M13: lifecycle('completed', 'completed', 'completed', 'needs_review'),
  M14: lifecycle('completed', 'completed', 'completed', 'working'),
  M15: lifecycle('completed', 'completed', 'working', 'completed'),
  M16: lifecycle('completed', 'completed', 'blocked', 'completed'),
  M17: lifecycle('completed', 'completed', 'working', 'completed'),
  M18: lifecycle('completed', 'completed', 'completed', 'completed'),
  M19: lifecycle('completed', 'completed', 'completed', 'completed'),
  M20: lifecycle('completed', 'completed', 'completed', 'completed'),
  M21: lifecycle('completed', 'completed', 'completed', 'completed'),
}

export function lifecycleForMoment(momentId: MomentId | null): LifecycleByAgent {
  return momentId === null ? WAITING_LIFECYCLE : LIFECYCLE_BY_MOMENT[momentId]
}

export const NOW_NEXT_BY_STAGE: Readonly<Record<RuntimeStage, NowNextPresentation>> = {
  Intake: {
    now: 'Reading complaint and attachments',
    next: 'Validate customer evidence',
  },
  Investigation: {
    now: 'Checking evidence and policy',
    next: 'Compare against enterprise systems',
  },
  Conflict: {
    now: 'Resolving system inconsistency',
    next: 'Prepare recommendation',
  },
  Approval: {
    now: 'Waiting for human decision',
    next: 'Generate resolution package',
  },
  Resolution: {
    now: 'Finalizing customer resolution',
    next: 'Complete case',
  },
}

export const FOCUS_BY_MOMENT: Readonly<Record<MomentId, RuntimeFocusTarget>> = {
  M01: 'agent-customer-complaint',
  M02: 'agent-customer-complaint',
  M03: 'agent-customer-complaint',
  M04: 'agent-policy',
  M05: 'agent-policy',
  M06: 'agent-workflow',
  M07: 'agent-workflow',
  M08: 'agent-workflow',
  M09: 'agent-workflow',
  M10: 'agent-workflow',
  M11: 'agent-workflow',
  M12: 'agent-finance',
  M13: 'approval',
  M14: 'agent-finance',
  M15: 'agent-workflow',
  M16: 'agent-workflow',
  M17: 'agent-workflow',
  M18: 'agent-workflow',
  M19: 'resolution',
  M20: 'resolution',
  M21: 'resolution',
}

const CUSTOMER_WORKING: DecisionRationalePresentation = {
  agentId: 'agent-customer-complaint',
  state: 'working',
  title: 'Reviewing customer evidence',
  bullets: ['Reading the complaint', 'Validating three supporting attachments'],
}

const CUSTOMER_RESULT: DecisionRationalePresentation = {
  agentId: 'agent-customer-complaint',
  state: 'result',
  title: 'Evidence found',
  bullets: [
    'Visible leakage detected',
    '3 attachments reviewed',
    'Simulated confidence: 94%',
  ],
}

const POLICY_WORKING: DecisionRationalePresentation = {
  agentId: 'agent-policy',
  state: 'working',
  title: 'Checking warranty policy',
  bullets: ['Matching complaint facts to the applicable handover policy'],
}

const POLICY_RESULT: DecisionRationalePresentation = {
  agentId: 'agent-policy',
  state: 'result',
  title: 'Relevant policy found',
  bullets: [
    'Complaint remains eligible for resolution',
    'Manager approval may be required',
  ],
}

const WORKFLOW_WORKING: DecisionRationalePresentation = {
  agentId: 'agent-workflow',
  state: 'working',
  title: 'Comparing enterprise records',
  bullets: ['Checking SAP CX status against verified customer evidence'],
}

const WORKFLOW_CONFLICT: DecisionRationalePresentation = {
  agentId: 'agent-workflow',
  state: 'result',
  title: 'System conflict detected',
  bullets: ['SAP CX status: Completed', 'Customer evidence: Issue unresolved'],
}

const FINANCE_WORKING: DecisionRationalePresentation = {
  agentId: 'agent-finance',
  state: 'working',
  title: 'Preparing recommendation',
  bullets: ['Calculating repair follow-up and service recovery options'],
}

const FINANCE_RESULT: DecisionRationalePresentation = {
  agentId: 'agent-finance',
  state: 'result',
  title: 'Recommendation prepared',
  bullets: [
    'Repair follow-up',
    'Partial compensation',
    'Human approval required',
  ],
}

const WORKFLOW_ASSIGNING: DecisionRationalePresentation = {
  agentId: 'agent-workflow',
  state: 'working',
  title: 'Assigning repair contractor',
  bullets: ['Identifying available contractors', 'Preparing repair task assignment'],
}

const WORKFLOW_BLOCKED: DecisionRationalePresentation = {
  agentId: 'agent-workflow',
  state: 'blocked',
  title: 'Contractor rejected task',
  bullets: ['Assigned contractor cannot accept the repair', 'Rerouting to alternative contractor'],
}

const WORKFLOW_REROUTING: DecisionRationalePresentation = {
  agentId: 'agent-workflow',
  state: 'working',
  title: 'Rerouting repair task',
  bullets: ['Alternative contractor identified', 'Task assignment in progress'],
}

const WORKFLOW_REROUTED: DecisionRationalePresentation = {
  agentId: 'agent-workflow',
  state: 'result',
  title: 'Task rerouted',
  bullets: ['Alternative contractor accepted', 'Repair task rescheduled'],
}

export const RATIONALE_BY_MOMENT: Readonly<
  Record<MomentId, DecisionRationalePresentation>
> = {
  M01: CUSTOMER_WORKING,
  M02: CUSTOMER_WORKING,
  M03: CUSTOMER_RESULT,
  M04: POLICY_WORKING,
  M05: POLICY_RESULT,
  M06: WORKFLOW_WORKING,
  M07: WORKFLOW_WORKING,
  M08: WORKFLOW_WORKING,
  M09: WORKFLOW_CONFLICT,
  M10: WORKFLOW_CONFLICT,
  M11: WORKFLOW_CONFLICT,
  M12: FINANCE_WORKING,
  M13: FINANCE_RESULT,
  M14: FINANCE_RESULT,
  M15: WORKFLOW_ASSIGNING,
  M16: WORKFLOW_BLOCKED,
  M17: WORKFLOW_REROUTING,
  M18: WORKFLOW_REROUTED,
  M19: FINANCE_RESULT,
  M20: FINANCE_RESULT,
  M21: FINANCE_RESULT,
}

export const TRANSITION_BY_MOMENT: Partial<
  Readonly<Record<MomentId, RuntimeTransitionPresentation>>
> = {
  M03: {
    title: 'Customer evidence verified',
    next: 'Moving to Investigation',
  },
  M05: {
    title: 'Relevant policy matched',
    next: 'Moving to enterprise system review',
  },
  M09: {
    title: 'System inconsistency detected',
    next: 'Preparing Recommendation',
  },
  M12: {
    title: 'Recommendation ready',
    next: 'Waiting for Human Approval',
  },
  M14: {
    title: 'Human decision received',
    next: 'Continuing resolution processing',
  },
  M18: {
    title: 'Rerouting completed',
    next: 'Moving to Resolution',
  },
}
