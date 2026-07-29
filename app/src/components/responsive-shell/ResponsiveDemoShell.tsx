import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../icon/Icon'
import {
  DESIGN_SURFACE_HEIGHT,
  DESIGN_SURFACE_WIDTH,
  StaticShell,
} from '../static-shell/StaticShell'
import type { StaticShellProps } from '../static-shell/StaticShell'
import { MobileStoryView } from './MobileStoryView'
import { classifyResponsiveLayout } from './responsiveModel'
import type {
  ResponsiveLayout,
  StorySectionId,
  ViewportSize,
} from './responsiveModel'
import styles from './ResponsiveDemoShell.module.css'

type MobileViewMode = 'entry' | 'story' | 'desktop'
type CanvasMode = 'fit' | 'actual'

const VIEWPORT_GUTTER = 24
const VIEWER_TOOLBAR_HEIGHT = 112

function viewportSize(): ViewportSize {
  return { width: window.innerWidth, height: window.innerHeight }
}

function useViewportSize(): ViewportSize {
  const [size, setSize] = useState(viewportSize)
  useEffect(() => {
    const onResize = () => setSize(viewportSize())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

function controlRoomScale(
  layout: ResponsiveLayout,
  width: number,
  height: number,
): number {
  const fitWidth = (width - VIEWPORT_GUTTER) / DESIGN_SURFACE_WIDTH
  const fitHeight = (height - VIEWPORT_GUTTER) / DESIGN_SURFACE_HEIGHT
  const fit = Math.min(1, fitWidth, fitHeight)
  if (layout === 'desktop') return Math.max(0.7, fit)
  return Math.max(0.72, Math.min(0.82, fit))
}

function MobileEntry({
  layout,
  onDesktop,
  onStory,
}: {
  readonly layout: ResponsiveLayout
  readonly onDesktop: () => void
  readonly onStory: () => void
}) {
  const isLandscape = layout === 'mobile-landscape'
  return (
    <main className={styles.mobileEntry} data-mobile-view="entry">
      <article>
        <span className={styles.entryIcon} aria-hidden="true"><Icon name="flow" size={34} /></span>
        <p className={styles.eyebrow}>AI collaboration simulation</p>
        <h1>{isLandscape ? 'Choose your mobile experience' : 'Best experienced in landscape mode'}</h1>
        <p>
          {isLandscape
            ? 'Use Overview for the complete control room, or follow the guided story one section at a time.'
            : 'For a clearer demo experience, rotate your phone or continue using Mobile Story View.'}
        </p>
        <div className={styles.entryChoices}>
          <button type="button" onClick={onStory}><Icon name="message" size={20} aria-hidden="true" /><span><strong>Open Mobile Story View</strong><small>Guided, readable, and touch-friendly</small></span></button>
          <button type="button" onClick={onDesktop}><Icon name="system" size={20} aria-hidden="true" /><span><strong>View Full Desktop</strong><small>Overview with fit and zoom controls</small></span></button>
        </div>
        <small className={styles.entryNote}>Orientation is a recommendation only. Both views use the same live demo state.</small>
      </article>
    </main>
  )
}

function MobileDesktopViewer({
  canvasMode,
  onCanvasModeChange,
  onShowChoices,
  onShowStory,
  size,
  ...runtime
}: StaticShellProps & {
  readonly canvasMode: CanvasMode
  readonly onCanvasModeChange: (mode: CanvasMode) => void
  readonly onShowChoices: () => void
  readonly onShowStory: () => void
  readonly size: ViewportSize
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const fitScale = Math.max(
    0.2,
    Math.min(
      1,
      (size.width - VIEWPORT_GUTTER) / DESIGN_SURFACE_WIDTH,
      (size.height - VIEWER_TOOLBAR_HEIGHT) / DESIGN_SURFACE_HEIGHT,
    ),
  )
  const scale = canvasMode === 'fit' ? fitScale : 1
  const resetView = () => {
    onCanvasModeChange('actual')
    if (scrollerRef.current !== null) {
      scrollerRef.current.scrollLeft = 0
      scrollerRef.current.scrollTop = 0
    }
  }
  return (
    <main className={styles.mobileDesktopViewer} data-mobile-view="desktop">
      <header className={styles.canvasToolbar}>
        <div><strong>Control Room Overview</strong><small>{Math.round(scale * 100)}% scale · native scroll and zoom available</small></div>
        <div>
          <button type="button" aria-pressed={canvasMode === 'fit'} onClick={() => onCanvasModeChange('fit')}><Icon name="system" size={17} aria-hidden="true" /> Fit to Screen</button>
          <button type="button" onClick={resetView}><Icon name="refresh" size={17} aria-hidden="true" /> Reset View</button>
          <button type="button" onClick={onShowStory}><Icon name="message" size={17} aria-hidden="true" /> Story View</button>
          <button type="button" onClick={onShowChoices}>Views</button>
        </div>
      </header>
      <div ref={scrollerRef} className={styles.canvasScroller} tabIndex={0} role="region" aria-label="Full desktop control room canvas">
        <StaticShell {...runtime} canvasScale={scale} embedded />
      </div>
    </main>
  )
}

export function ResponsiveDemoShell(props: StaticShellProps) {
  const size = useViewportSize()
  const layout = useMemo(() => classifyResponsiveLayout(size), [size])
  const isMobile = layout === 'mobile-portrait' || layout === 'mobile-landscape'
  const [mobileView, setMobileView] = useState<MobileViewMode>('entry')
  const [activeStorySection, setActiveStorySection] = useState<StorySectionId>('customer')
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('fit')

  let experience

  if (!isMobile) {
    const scale = controlRoomScale(layout, size.width, size.height)
    experience = (
      <main className={styles.responsiveRoot} data-responsive-layout={layout}>
        <div className={styles.controlRoomScroller} role="region" aria-label={`${layout} control room`}>
          <StaticShell
            {...props}
            canvasScale={scale}
            embedded
          />
        </div>
      </main>
    )
  } else if (mobileView === 'entry') {
    experience = <MobileEntry layout={layout} onDesktop={() => setMobileView('desktop')} onStory={() => setMobileView('story')} />
  } else if (mobileView === 'desktop') {
    experience = (
      <MobileDesktopViewer
        {...props}
        canvasMode={canvasMode}
        onCanvasModeChange={setCanvasMode}
        onShowChoices={() => setMobileView('entry')}
        onShowStory={() => setMobileView('story')}
        size={size}
      />
    )
  } else {
    experience = (
      <MobileStoryView
        {...props}
        activeSection={activeStorySection}
        onActiveSectionChange={setActiveStorySection}
        onShowChoices={() => setMobileView('entry')}
        onShowDesktop={() => setMobileView('desktop')}
      />
    )
  }

  return experience
}
