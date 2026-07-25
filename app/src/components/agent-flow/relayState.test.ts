import { describe, expect, it } from 'vitest'
import { relayState } from './relayState'

describe('relayState', () => {
  it('propagates blocked from downstream regardless of upstream', () => {
    expect(relayState('waiting', 'blocked')).toBe('blocked')
    expect(relayState('working', 'blocked')).toBe('blocked')
    expect(relayState('completed', 'blocked')).toBe('blocked')
  })

  it('propagates needs_review from downstream regardless of upstream', () => {
    expect(relayState('waiting', 'needs_review')).toBe('needs_review')
    expect(relayState('completed', 'needs_review')).toBe('needs_review')
  })

  it('reports working when either side is working (and downstream is not blocked/needs_review)', () => {
    expect(relayState('working', 'waiting')).toBe('working')
    expect(relayState('waiting', 'working')).toBe('working')
    expect(relayState('completed', 'working')).toBe('working')
  })

  it('reports completed only when both sides are completed', () => {
    expect(relayState('completed', 'completed')).toBe('completed')
  })

  it('defaults to waiting when neither side has advanced', () => {
    expect(relayState('waiting', 'waiting')).toBe('waiting')
  })
})
