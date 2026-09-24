import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import Timeline from './Timeline'
afterEach(() => { location.hash = '' })
it('opens linked memories and supports keyboard selection along the star path', async () => {
  location.hash = '/timeline?era=liners'
  const user = userEvent.setup()
  render(<Timeline openPhoto={vi.fn()} />)
  const star = screen.getByRole('button', { name: 'Explore Perfect 10 Liners' })
  expect(star).toHaveAttribute('aria-pressed', 'true')
  star.focus()
  await user.keyboard('{ArrowRight}{Enter}')
  expect(screen.getByRole('button', { name: 'Explore Sunnymoon & ShineRise' })).toHaveAttribute('aria-pressed', 'true')
  expect(location.hash).toContain('era=fancon')
  expect(screen.getByRole('region', { name: 'Selected memory' })).toHaveTextContent('Sunnymoon & ShineRise')
})
