import { render, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApprovalStatus } from '../../domain/runtime-fixtures/types'
import type { RuntimeState } from '../../domain/runtime'
import { useApprovalAutoScroll } from './useApprovalAutoScroll'

type PlaybackStatus = RuntimeState['playbackStatus']

function Harness({
  approvalStatus,
  playbackStatus,
}: {
  approvalStatus: ApprovalStatus
  playbackStatus: PlaybackStatus
}) {
  useApprovalAutoScroll(approvalStatus, playbackStatus)
  return (
    <div>
      <div data-testid="trust-body" />
      <section data-testid="human-approval" />
    </div>
  )
}

let scrollToSpy: ReturnType<typeof vi.fn>
let matchMediaSpy: ReturnType<typeof vi.fn>
let reducedMotion = false

beforeEach(() => {
  scrollToSpy = vi.fn()
  Element.prototype.scrollTo = scrollToSpy as unknown as typeof Element.prototype.scrollTo

  reducedMotion = false
  matchMediaSpy = vi.fn((query: string) => ({
    matches: query.includes('reduce') ? reducedMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  window.matchMedia = matchMediaSpy as unknown as typeof window.matchMedia

  const originalRaf = window.requestAnimationFrame
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0)
    return 0
  }) as typeof window.requestAnimationFrame
  ;(window as unknown as { __originalRaf: typeof window.requestAnimationFrame }).__originalRaf =
    originalRaf
})

afterEach(() => {
  cleanup()
  const originalRaf = (
    window as unknown as { __originalRaf?: typeof window.requestAnimationFrame }
  ).__originalRaf
  if (originalRaf) window.requestAnimationFrame = originalRaf
})

describe('useApprovalAutoScroll', () => {
  it('does not scroll on initial render at pending', () => {
    render(<Harness approvalStatus="pending" playbackStatus="running" />)
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  it('does not scroll on initial render at not_required', () => {
    render(<Harness approvalStatus="not_required" playbackStatus="running" />)
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  it('scrolls exactly once when approvalStatus transitions from pending to approved', () => {
    const { rerender } = render(
      <Harness approvalStatus="pending" playbackStatus="waiting_approval" />,
    )
    expect(scrollToSpy).not.toHaveBeenCalled()
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' }),
    )
  })

  it('does not repeat scroll when approver progression updates while card is still in view', () => {
    const { rerender } = render(
      <Harness approvalStatus="pending" playbackStatus="waiting_approval" />,
    )
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    // Simulate re-render caused by approver progress ticking to 1/4, 2/4, 3/4, 4/4.
    // approvalStatus remains 'approved'; card remains present in the DOM viewport (mocked).
    scrollToSpy.mockClear()
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    // approvalStatus reference is stable across those renders so effect does not re-fire.
    expect(scrollToSpy).not.toHaveBeenCalled()
  })

  it('resets the one-shot trigger on restart (playbackStatus back to idle)', () => {
    const { rerender } = render(
      <Harness approvalStatus="pending" playbackStatus="waiting_approval" />,
    )
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
    // Restart: mode returns to idle and approval resets to pending.
    rerender(<Harness approvalStatus="pending" playbackStatus="idle" />)
    // Second approval cycle should scroll again.
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    expect(scrollToSpy).toHaveBeenCalledTimes(2)
  })

  it('uses instant (auto) behavior when prefers-reduced-motion is enabled', () => {
    reducedMotion = true
    const { rerender } = render(
      <Harness approvalStatus="pending" playbackStatus="waiting_approval" />,
    )
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' }),
    )
  })

  it('never scrolls window, document, .controlRoomScroller, or .trustContent', () => {
    // Guard: our scroll must be invoked on the trust-body element only. The mock replaces
    // Element.prototype.scrollTo, so any invocation is captured. We assert that the invoked
    // element (this) matches the trust-body target.
    scrollToSpy.mockImplementation(function (this: Element) {
      expect(this.getAttribute('data-testid')).toBe('trust-body')
    })
    const { rerender } = render(
      <Harness approvalStatus="pending" playbackStatus="waiting_approval" />,
    )
    rerender(<Harness approvalStatus="approved" playbackStatus="running" />)
    expect(scrollToSpy).toHaveBeenCalledTimes(1)
  })
})
