import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Icon } from './Icon'

describe('Icon', () => {
  it('stays decorative by default', () => {
    const { container } = render(<Icon name="flow" />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('can expose a concise accessible label when used independently', () => {
    render(<Icon label="Workflow status" name="activity" />)

    expect(screen.getByRole('img', { name: 'Workflow status' })).toBeInTheDocument()
  })
})
