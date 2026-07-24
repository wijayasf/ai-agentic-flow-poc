import type { ArtifactPresentation } from '../../domain/runtime'

export function artifactTrailingGlyph(status: ArtifactPresentation['status']) {
  switch (status) {
    case 'locked':
      return '⌑'
    case 'pending':
      return '◷'
    case 'approved':
      return '✓'
    case 'available':
      return '›'
    default:
      return status satisfies never
  }
}
