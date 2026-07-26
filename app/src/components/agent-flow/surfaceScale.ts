const MATRIX_A_PATTERN = /^matrix(?:3d)?\(\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/i
const SCALE_PATTERN = /scale(?:x)?\(\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/i

export function parseTransformScaleX(
  transform: string | null | undefined,
): number {
  if (!transform || transform === 'none') return 1

  if (typeof DOMMatrixReadOnly !== 'undefined') {
    try {
      const matrix = new DOMMatrixReadOnly(transform)
      if (Number.isFinite(matrix.a) && matrix.a > 0) return matrix.a
    } catch {
      // fall through to string parsing below
    }
  }

  const matrixMatch = MATRIX_A_PATTERN.exec(transform)
  if (matrixMatch) {
    const parsed = parseFloat(matrixMatch[1])
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  const scaleMatch = SCALE_PATTERN.exec(transform)
  if (scaleMatch) {
    const parsed = parseFloat(scaleMatch[1])
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }

  return 1
}

export function readSurfaceScaleX(surface: Element | null | undefined): number {
  if (!surface) return 1
  if (typeof window === 'undefined') return 1
  const transform = window.getComputedStyle(surface).transform
  return parseTransformScaleX(transform)
}

export function visualDeltaToLayoutDelta(
  visualDelta: number,
  scaleX: number,
): number {
  const safeScale = Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1
  return visualDelta / safeScale
}
