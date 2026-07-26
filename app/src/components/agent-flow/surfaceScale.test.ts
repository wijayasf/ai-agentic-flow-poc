import { afterEach, describe, expect, it } from 'vitest'
import {
  parseTransformScaleX,
  readSurfaceScaleX,
  visualDeltaToLayoutDelta,
} from './surfaceScale'

describe('parseTransformScaleX', () => {
  it('returns 1 for empty, null, undefined, or "none"', () => {
    expect(parseTransformScaleX('none')).toBe(1)
    expect(parseTransformScaleX('')).toBe(1)
    expect(parseTransformScaleX(null)).toBe(1)
    expect(parseTransformScaleX(undefined)).toBe(1)
  })

  it('extracts X scale from scale(x) and matrix(...) strings', () => {
    expect(parseTransformScaleX('scale(0.7)')).toBeCloseTo(0.7, 6)
    expect(parseTransformScaleX('matrix(0.7, 0, 0, 0.7, 0, 0)')).toBeCloseTo(
      0.7,
      6,
    )
    expect(parseTransformScaleX('matrix(1, 0, 0, 1, 0, 0)')).toBe(1)
    expect(parseTransformScaleX('scale(0.81111)')).toBeCloseTo(0.81111, 5)
  })

  it('falls back to 1 for zero, negative, or malformed transforms', () => {
    expect(parseTransformScaleX('matrix(0, 0, 0, 0, 0, 0)')).toBe(1)
    expect(parseTransformScaleX('scale(-0.5)')).toBe(1)
    expect(parseTransformScaleX('rotate(45deg)')).toBe(1)
    expect(parseTransformScaleX('not-a-transform')).toBe(1)
  })
})

describe('readSurfaceScaleX', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('returns 1 when the surface element is missing', () => {
    expect(readSurfaceScaleX(null)).toBe(1)
    expect(readSurfaceScaleX(undefined)).toBe(1)
  })

  it('returns 1 when the element has no transform', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(readSurfaceScaleX(el)).toBe(1)
  })

  it('reads the X scale from an inline transform', () => {
    const el = document.createElement('div')
    el.style.transform = 'scale(0.7)'
    document.body.appendChild(el)
    expect(readSurfaceScaleX(el)).toBeCloseTo(0.7, 6)
  })
})

describe('visualDeltaToLayoutDelta', () => {
  it('scale 1.0: visual delta 292.75 → layout delta 292.75', () => {
    expect(visualDeltaToLayoutDelta(292.75, 1)).toBeCloseTo(292.75, 6)
  })

  it('scale 0.7: visual delta 204.925 → layout delta 292.75', () => {
    expect(visualDeltaToLayoutDelta(204.925, 0.7)).toBeCloseTo(292.75, 6)
  })

  it('scale 0.81111: dividing the pre-scaled delta restores the original', () => {
    const layoutDelta = 292.75
    const scale = 0.81111
    const visualDelta = layoutDelta * scale
    expect(visualDeltaToLayoutDelta(visualDelta, scale)).toBeCloseTo(
      layoutDelta,
      6,
    )
  })

  it('falls back to identity when the scale is invalid, zero, or negative', () => {
    expect(visualDeltaToLayoutDelta(100, 0)).toBe(100)
    expect(visualDeltaToLayoutDelta(100, -0.5)).toBe(100)
    expect(visualDeltaToLayoutDelta(100, Number.NaN)).toBe(100)
    expect(visualDeltaToLayoutDelta(100, Number.POSITIVE_INFINITY)).toBe(100)
  })
})
