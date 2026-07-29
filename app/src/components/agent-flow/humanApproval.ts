import resolutionPlan from '@fixtures/finance/resolution-plan.json'
import { runtimeFixtures } from '../../domain/runtime-fixtures/loadRuntimeFixtures'
import type {
  ApproverIndex,
  RuntimeFixtureBundle,
} from '../../domain/runtime-fixtures/types'
import type { RuntimeState, RuntimeViewModel } from '../../domain/runtime'

export type ApproverStepStatus = 'waiting' | 'reviewing' | 'approved'

export interface ApproverStep {
  readonly index: ApproverIndex
  readonly name: string
  readonly role: string
  readonly status: ApproverStepStatus
}

export interface CompensationDetail {
  readonly amount: number
  readonly currency: string
  readonly display: string
}

export interface HumanApprovalPackage {
  readonly title: string
  readonly compensation: CompensationDetail
  readonly operationalResolution: readonly string[]
  readonly financialAction: readonly string[]
}

export interface HumanApprovalProgress {
  readonly completed: 0 | 1 | 2 | 3 | 4
  readonly total: 4
  readonly percent: 0 | 25 | 50 | 75 | 100
  readonly label: string
}

export interface HumanApprovalViewModel {
  readonly heading: string
  readonly subtitle: string
  readonly awaitingHumanDecision: boolean
  readonly enterpriseWorkflowActive: boolean
  readonly enterpriseWorkflowComplete: boolean
  readonly disbursementInProgress: boolean
  readonly isCollapsed: boolean
  readonly approvers: readonly ApproverStep[]
  readonly progress: HumanApprovalProgress
  readonly package: HumanApprovalPackage
  readonly collapsedSummary: {
    readonly heading: string
    readonly progressLabel: string
    readonly toggleLabel: string
  }
}

export const HUMAN_APPROVAL_HEADING = 'Human Approval'
export const AWAITING_SUBTITLE =
  'Approval package ready. Approve to start the four-step enterprise approval workflow.'
export const ENTERPRISE_SUBTITLE = 'Executing Enterprise Approval Workflow'
export const APPROVAL_COMPLETE_SUBTITLE = 'Enterprise Approval Workflow completed'

const PACKAGE_TITLE = 'Enterprise Approval Package'
const OPERATIONAL_RESOLUTION: readonly string[] = [
  'Site inspection',
  'Maintenance work order',
  'Vendor assignment',
  'Daily customer updates',
]
const FINANCIAL_ACTION: readonly string[] = [
  'Initiate compensation disbursement after full approval',
]

const COMPENSATION: CompensationDetail = {
  amount: resolutionPlan.compensationAmount,
  currency: resolutionPlan.compensationCurrency,
  display: resolutionPlan.compensationDisplay,
}

const COLLAPSED_SUMMARY = {
  heading: 'Enterprise Approval Completed',
  progressLabel: '4 of 4 approvals',
  toggleLabel: 'View details',
} as const

function stepStatus(
  approverIndex: ApproverIndex,
  completed: 0 | 1 | 2 | 3 | 4,
): ApproverStepStatus {
  if (approverIndex <= completed) return 'approved'
  if (approverIndex === completed + 1) return 'reviewing'
  return 'waiting'
}

export function selectHumanApproval(
  state: RuntimeState,
  viewModel: RuntimeViewModel,
  fixtures: RuntimeFixtureBundle = runtimeFixtures,
): HumanApprovalViewModel | null {
  if (state.terminalOutcome === 'escalated') return null
  // At successful case completion, FinalOutcome (Case Resolved) already carries
  // the "4 of 4 approvals completed" summary; suppress the Human Approval card
  // and its End-of-AI-Analysis divider so Case Resolved is the terminal visual.
  if (state.playbackStatus === 'completed') return null
  const stage = viewModel.currentStage
  if (stage !== 'Approval' && stage !== 'Resolution') return null

  const awaitingHumanDecision =
    state.playbackStatus === 'waiting_approval' &&
    state.approvalStatus === 'pending'
  const enterpriseWorkflowComplete = state.approversCompleted === 4
  const enterpriseWorkflowActive =
    state.approvalStatus === 'approved' && !enterpriseWorkflowComplete

  // Collapse trigger: once the Finance Agent has been reactivated for
  // disbursement (its lifecycle status returns to 'working' or its work is
  // 'completed' during the Resolution stage) and all four approvals are in,
  // the Human Approval card compacts to a summary. The four-of-four approval
  // list stays available on demand via the toggle.
  const financeStatus = viewModel.agentLifecycle.find(
    (agent) => agent.agentId === 'agent-finance',
  )?.status
  const disbursementInProgress =
    enterpriseWorkflowComplete &&
    stage === 'Resolution' &&
    (financeStatus === 'working' || financeStatus === 'completed')
  const isCollapsed = disbursementInProgress

  const approvers: readonly ApproverStep[] =
    fixtures.timeline.approval.approvers.map((approver) => ({
      index: approver.index,
      name: approver.name,
      role: approver.role,
      status: awaitingHumanDecision
        ? 'waiting'
        : stepStatus(approver.index, state.approversCompleted),
    }))

  const subtitle = awaitingHumanDecision
    ? AWAITING_SUBTITLE
    : enterpriseWorkflowComplete
      ? APPROVAL_COMPLETE_SUBTITLE
      : ENTERPRISE_SUBTITLE

  const completed = state.approversCompleted
  const percent = (completed * 25) as HumanApprovalProgress['percent']
  const progress: HumanApprovalProgress = {
    completed,
    total: 4,
    percent,
    label: `${completed} of 4 approved`,
  }

  return {
    heading: HUMAN_APPROVAL_HEADING,
    subtitle,
    awaitingHumanDecision,
    enterpriseWorkflowActive,
    enterpriseWorkflowComplete,
    disbursementInProgress,
    isCollapsed,
    approvers,
    progress,
    package: {
      title: PACKAGE_TITLE,
      compensation: COMPENSATION,
      operationalResolution: OPERATIONAL_RESOLUTION,
      financialAction: FINANCIAL_ACTION,
    },
    collapsedSummary: COLLAPSED_SUMMARY,
  }
}
