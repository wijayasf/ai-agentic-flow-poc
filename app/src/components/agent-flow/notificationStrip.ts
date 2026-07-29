import type { RuntimeState } from '../../domain/runtime'
import type { MomentId } from '../../domain/runtime-fixtures/types'

export type NotificationTone = 'progress' | 'success' | 'awaiting' | 'neutral'

export interface NotificationStripViewModel {
  readonly key: string
  readonly message: string
  readonly tone: NotificationTone
}

const OFFICER_DISPATCH_COMPLAINT =
  'AI Agentic Case Officer is dispatching Customer Complaint Agent.'
const COMPLAINT_RETURNED =
  'Customer Complaint Agent returned the complaint analysis package.'
const OFFICER_RECEIVED_COMPLAINT =
  'Complaint analysis package received by AI Agentic Case Officer.'
const OFFICER_DISPATCH_POLICY = 'AI Agentic Case Officer is dispatching Policy Agent.'
const POLICY_RETURNED = 'Policy Agent returned the policy evidence package.'
const OFFICER_RECEIVED_POLICY =
  'Policy evidence package received by AI Agentic Case Officer.'
const OFFICER_DISPATCH_WORKFLOW =
  'AI Agentic Case Officer is dispatching Workflow Agent.'
const WORKFLOW_RETURNED = 'Workflow Agent returned the enterprise workflow package.'
const OFFICER_RECEIVED_WORKFLOW =
  'Enterprise workflow package received by AI Agentic Case Officer.'
const OFFICER_DISPATCH_FINANCE = 'AI Agentic Case Officer is dispatching Finance Agent.'
const FINANCE_RETURNED = 'Finance Agent returned the compensation recommendation.'
const OFFICER_RECEIVED_FINANCE =
  'Compensation recommendation received by AI Agentic Case Officer.'
const OFFICER_PREPARING_FINAL_RESPONSE =
  'AI Agentic Case Officer prepared the final customer response — delivered by AI Resolution Officer.'
const COMPLAINT_WORKING = 'Customer Complaint Agent is analysing case evidence.'
const COMPLAINT_FINALISING =
  'Customer Complaint Agent is finalising analysis for handback.'
const POLICY_WORKING = 'Policy Agent is validating coverage.'
const POLICY_FINALISING = 'Policy Agent is finalising validation for handback.'
const WORKFLOW_WORKING = 'Workflow Agent is running enterprise workflow steps.'
const WORKFLOW_FINALISING = 'Workflow Agent is finalising the workflow package.'
const FINANCE_WORKING = 'Finance Agent is preparing the compensation recommendation.'
const FINANCE_FINALISING =
  'Finance Agent is finalising the compensation recommendation.'
const ENTERPRISE_APPROVAL = 'Enterprise approval workflow in progress.'
const ENTERPRISE_APPROVAL_COMPLETE =
  'Four enterprise approvals recorded — result returned to AI Agentic Case Officer.'
const WORKFLOW_ROUTING =
  'AI Agentic Case Officer reactivated Workflow Agent to route the enterprise approval package.'
const FINANCE_DISBURSING =
  'AI Agentic Case Officer reactivated Finance Agent for compensation disbursement.'
const DISBURSEMENT_INITIATED = 'Finance Agent initiated the compensation disbursement.'

const MESSAGES: Partial<Record<MomentId, NotificationStripViewModel>> = {
  M03: { key: 'M03', message: 'Officer acknowledged the customer.', tone: 'success' },
  M04: { key: 'M04', message: OFFICER_DISPATCH_COMPLAINT, tone: 'progress' },
  M05: { key: 'M05', message: COMPLAINT_WORKING, tone: 'progress' },
  M06: { key: 'M06', message: COMPLAINT_WORKING, tone: 'progress' },
  M07: { key: 'M07', message: COMPLAINT_FINALISING, tone: 'progress' },
  M08: { key: 'M08', message: COMPLAINT_RETURNED, tone: 'success' },
  M09: { key: 'M09', message: OFFICER_DISPATCH_POLICY, tone: 'progress' },
  M10: { key: 'M10', message: POLICY_WORKING, tone: 'progress' },
  M11: { key: 'M11', message: POLICY_WORKING, tone: 'progress' },
  M12: { key: 'M12', message: POLICY_FINALISING, tone: 'progress' },
  M13: { key: 'M13', message: POLICY_RETURNED, tone: 'success' },
  M14: { key: 'M14', message: OFFICER_DISPATCH_WORKFLOW, tone: 'progress' },
  M15: { key: 'M15', message: WORKFLOW_WORKING, tone: 'progress' },
  M16: { key: 'M16', message: WORKFLOW_WORKING, tone: 'progress' },
  M17: { key: 'M17', message: WORKFLOW_WORKING, tone: 'progress' },
  M18: { key: 'M18', message: WORKFLOW_FINALISING, tone: 'progress' },
  M19: { key: 'M19', message: WORKFLOW_RETURNED, tone: 'success' },
  M20: { key: 'M20', message: OFFICER_DISPATCH_FINANCE, tone: 'progress' },
  M21: { key: 'M21', message: FINANCE_WORKING, tone: 'progress' },
  M22: { key: 'M22', message: FINANCE_WORKING, tone: 'progress' },
  M23: { key: 'M23', message: FINANCE_FINALISING, tone: 'progress' },
  M24: { key: 'M24', message: FINANCE_RETURNED, tone: 'success' },
  M25: { key: 'M25', message: WORKFLOW_ROUTING, tone: 'awaiting' },
  M26: { key: 'M26', message: ENTERPRISE_APPROVAL, tone: 'progress' },
  M27: { key: 'M27', message: ENTERPRISE_APPROVAL, tone: 'progress' },
  M28: { key: 'M28', message: ENTERPRISE_APPROVAL, tone: 'progress' },
  M29: { key: 'M29', message: ENTERPRISE_APPROVAL_COMPLETE, tone: 'success' },
  M30: { key: 'M30', message: FINANCE_DISBURSING, tone: 'progress' },
  M31: { key: 'M31', message: DISBURSEMENT_INITIATED, tone: 'success' },
  M32: { key: 'M32', message: OFFICER_PREPARING_FINAL_RESPONSE, tone: 'success' },
  M33: { key: 'M33', message: 'Case closed.', tone: 'success' },
}

/**
 * Constants exported for tests. Keeping named exports lets validation
 * assert on the reactivation copy without stringly-matched literals.
 */
export const NOTIFICATION_STRIP_COPY = {
  workflowRouting: WORKFLOW_ROUTING,
  financeDisbursing: FINANCE_DISBURSING,
  disbursementInitiated: DISBURSEMENT_INITIATED,
  officerDispatchComplaint: OFFICER_DISPATCH_COMPLAINT,
  complaintReturned: COMPLAINT_RETURNED,
  officerReceivedComplaint: OFFICER_RECEIVED_COMPLAINT,
  officerDispatchPolicy: OFFICER_DISPATCH_POLICY,
  policyReturned: POLICY_RETURNED,
  officerReceivedPolicy: OFFICER_RECEIVED_POLICY,
  officerDispatchWorkflow: OFFICER_DISPATCH_WORKFLOW,
  workflowReturned: WORKFLOW_RETURNED,
  officerReceivedWorkflow: OFFICER_RECEIVED_WORKFLOW,
  officerDispatchFinance: OFFICER_DISPATCH_FINANCE,
  financeReturned: FINANCE_RETURNED,
  officerReceivedFinance: OFFICER_RECEIVED_FINANCE,
  enterpriseApprovalComplete: ENTERPRISE_APPROVAL_COMPLETE,
  officerPreparingFinalResponse: OFFICER_PREPARING_FINAL_RESPONSE,
} as const

export function selectNotificationStrip(
  state: RuntimeState,
): NotificationStripViewModel | null {
  const moment = state.currentMomentId
  if (moment === null) return null
  return MESSAGES[moment] ?? null
}
