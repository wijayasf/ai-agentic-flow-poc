import type { IconName } from '../icon/Icon'
import type { AgentId, SystemId } from '../../domain/runtime-fixtures/types'
import type { AgentLifecycleStatus } from '../../domain/runtime'

export type AgentTone = 'blue' | 'green' | 'violet' | 'orange' | 'red' | 'amber'

export interface AgentConfig {
  readonly id: AgentId
  readonly name: string
  readonly icon: IconName
  readonly skill: string
  readonly tone: AgentTone
}

export interface SystemBrandAsset {
  readonly src: string
  readonly alt: string
}

export interface SystemConfig {
  readonly id: SystemId
  readonly name: string
  readonly icon: IconName
  readonly tone: AgentTone
  readonly brandAsset?: SystemBrandAsset
}

export const agents: ReadonlyArray<AgentConfig> = [
  {
    id: 'agent-customer-complaint',
    name: 'Customer Complaint Agent',
    icon: 'message',
    skill: 'Image understanding',
    tone: 'green',
  },
  {
    id: 'agent-policy',
    name: 'Policy Agent',
    icon: 'policy',
    skill: 'Policy retrieval',
    tone: 'violet',
  },
  {
    id: 'agent-workflow',
    name: 'Workflow Agent',
    icon: 'search',
    skill: 'SAP CX investigation',
    tone: 'blue',
  },
  {
    id: 'agent-finance',
    name: 'Finance Agent',
    icon: 'calculator',
    skill: 'Financial calculation',
    tone: 'orange',
  },
]

export const systems: ReadonlyArray<SystemConfig> = [
  {
    id: 'system-crm',
    name: 'CRM',
    icon: 'database',
    tone: 'green',
    brandAsset: {
      src: '/assets/brands/salesforce-cloud.png',
      alt: '',
    },
  },
  {
    id: 'system-policy-repository',
    name: 'Policy Repository',
    icon: 'policy',
    tone: 'violet',
    brandAsset: {
      src: '/assets/icons/file-text-blue.png',
      alt: '',
    },
  },
  {
    id: 'system-sap-cx',
    name: 'SAP CX',
    icon: 'system',
    tone: 'blue',
    brandAsset: {
      src: '/assets/brands/sap-cx-symbol.png',
      alt: '',
    },
  },
  {
    id: 'system-sap-s4hana',
    name: 'SAP S/4HANA',
    icon: 'database',
    tone: 'orange',
    brandAsset: {
      src: '/assets/brands/sap-s4hana-symbol.png',
      alt: '',
    },
  },
]

export const lifecycleLabels: Readonly<Record<AgentLifecycleStatus, string>> = {
  waiting: 'Waiting',
  working: 'Working',
  needs_review: 'Needs Review',
  completed: 'Completed',
  blocked: 'Blocked',
}
