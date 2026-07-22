import type { IconName } from '../icon/Icon'

export type ResponsiveLayout =
  | 'desktop'
  | 'tablet'
  | 'mobile-portrait'
  | 'mobile-landscape'

export interface ViewportSize {
  readonly width: number
  readonly height: number
}

export const STORY_SECTIONS = [
  { id: 'customer', label: 'Customer Story', icon: 'message' },
  { id: 'flow', label: 'Agentic Flow', icon: 'flow' },
  { id: 'trust', label: 'Trust & Observability', icon: 'shield' },
  { id: 'approval', label: 'Human Approval', icon: 'approval' },
  { id: 'outcome', label: 'Final Outcome', icon: 'flag' },
] as const satisfies ReadonlyArray<{
  readonly id: string
  readonly label: string
  readonly icon: IconName
}>

export type StorySectionId = (typeof STORY_SECTIONS)[number]['id']

const MOBILE_WIDTH = 768
const DESKTOP_WIDTH = 1200
const COMPACT_LANDSCAPE_HEIGHT = 600
const COMPACT_LANDSCAPE_WIDTH = 1024

/**
 * Responsive strategy:
 * - 1200px and wider: fitted desktop control room.
 * - 768–1199px: readable tablet canvas contained by its own scroller.
 * - Below 768px: guided mobile choice, with a compact-landscape exception.
 *
 * These are presentation categories only; runtime state is never derived here.
 */
export function classifyResponsiveLayout({ width, height }: ViewportSize): ResponsiveLayout {
  if (width < MOBILE_WIDTH) {
    return height < width ? 'mobile-landscape' : 'mobile-portrait'
  }
  if (height < COMPACT_LANDSCAPE_HEIGHT && width < COMPACT_LANDSCAPE_WIDTH) {
    return 'mobile-landscape'
  }
  return width < DESKTOP_WIDTH ? 'tablet' : 'desktop'
}
