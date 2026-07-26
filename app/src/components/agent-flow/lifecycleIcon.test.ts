import { describe, expect, it } from 'vitest'
import { lifecycleIcon } from './lifecycleIcon'

describe('lifecycleIcon', () => {
  it('maps every AgentLifecycleStatus to a distinct presentation icon', () => {
    expect(lifecycleIcon('waiting')).toBe('clock')
    expect(lifecycleIcon('working')).toBe('activity')
    expect(lifecycleIcon('needs_review')).toBe('approval')
    expect(lifecycleIcon('completed')).toBe('check')
    expect(lifecycleIcon('blocked')).toBe('alert')
  })
})
