import { useEffect, useRef } from 'react'
import type { ApprovalStatus } from '../../domain/runtime-fixtures/types'
import type { RuntimeState } from '../../domain/runtime'

const TRUST_BODY_SELECTOR = '[data-testid="trust-body"]'
const HUMAN_APPROVAL_SELECTOR = '[data-testid="human-approval"]'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function findElements() {
  if (typeof document === 'undefined') return null
  const trustBody = document.querySelector<HTMLElement>(TRUST_BODY_SELECTOR)
  const humanApproval = document.querySelector<HTMLElement>(HUMAN_APPROVAL_SELECTOR)
  if (!trustBody || !humanApproval) return null
  return { trustBody, humanApproval }
}

function offsetTopWithin(node: HTMLElement, container: HTMLElement): number {
  let top = 0
  let current: HTMLElement | null = node
  while (current && current !== container) {
    top += current.offsetTop
    const parent: Element | null = current.offsetParent
    if (!(parent instanceof HTMLElement)) break
    current = parent
  }
  return top
}

function computeTargetScrollTop(trustBody: HTMLElement, humanApproval: HTMLElement) {
  const haOffsetTop = offsetTopWithin(humanApproval, trustBody)
  const haHeight = humanApproval.offsetHeight
  const clientHeight = trustBody.clientHeight
  // Land slightly above center: 30% of the free space above the card.
  const freeSpace = Math.max(0, clientHeight - haHeight)
  const target = haOffsetTop - freeSpace * 0.3
  const maxScroll = Math.max(0, trustBody.scrollHeight - clientHeight)
  return Math.max(0, Math.min(target, maxScroll))
}

function isHumanApprovalOutOfView(trustBody: HTMLElement, humanApproval: HTMLElement) {
  const haOffsetTop = offsetTopWithin(humanApproval, trustBody)
  const haHeight = humanApproval.offsetHeight
  const scrollTop = trustBody.scrollTop
  const clientHeight = trustBody.clientHeight
  return haOffsetTop + haHeight <= scrollTop || haOffsetTop >= scrollTop + clientHeight
}

export function scrollHumanApprovalIntoTrustBody(): boolean {
  const els = findElements()
  if (!els) return false
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
  els.trustBody.scrollTo({ top: computeTargetScrollTop(els.trustBody, els.humanApproval), behavior })
  return true
}

export function useApprovalAutoScroll(
  approvalStatus: ApprovalStatus,
  playbackStatus: RuntimeState['playbackStatus'],
) {
  const hasScrolledRef = useRef(false)
  const prevApprovalStatusRef = useRef<ApprovalStatus>(approvalStatus)

  useEffect(() => {
    if (playbackStatus === 'idle') {
      hasScrolledRef.current = false
    }
  }, [playbackStatus])

  useEffect(() => {
    const previous = prevApprovalStatusRef.current
    prevApprovalStatusRef.current = approvalStatus
    if (approvalStatus !== 'approved') return
    const isFirstApproval = previous === 'pending' && !hasScrolledRef.current
    if (isFirstApproval) {
      hasScrolledRef.current = true
      // Defer to the next frame so the DOM commit from APPROVE has painted.
      const rafId = window.requestAnimationFrame(() => {
        scrollHumanApprovalIntoTrustBody()
      })
      return () => window.cancelAnimationFrame(rafId)
    }
    // Subsequent approver progression: only re-scroll if the card has moved out of view.
    const els = findElements()
    if (!els) return
    if (isHumanApprovalOutOfView(els.trustBody, els.humanApproval)) {
      scrollHumanApprovalIntoTrustBody()
    }
  }, [approvalStatus])
}
