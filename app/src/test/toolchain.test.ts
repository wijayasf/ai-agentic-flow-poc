import { describe, expect, it, vi } from 'vitest'
import fixtureIndex from '@fixtures/index.json'

describe('deterministic timer support', () => {
  it('advances a fake timer without wall-clock delay', () => {
    vi.useFakeTimers()
    const callback = vi.fn()

    setTimeout(callback, 1_000)
    vi.advanceTimersByTime(999)
    expect(callback).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(callback).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})

describe('local fixture support', () => {
  it('imports repository JSON at build time', () => {
    expect(fixtureIndex.scenario).toBe('mock-data/scenarios/main-scenario.json')
  })
})
