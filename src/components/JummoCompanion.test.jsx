import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import JummoCompanion from './JummoCompanion'
it('offers context and remembers a session dismissal across routes', async () => {
  sessionStorage.clear()
  const user = userEvent.setup()
  const view = render(<JummoCompanion route="studio" />)
  expect(screen.getByRole('link', { name: 'Explore the Archive ↗' })).toHaveAttribute('href', '#/timeline')
  await user.click(screen.getByRole('button', { name: 'Dismiss Jummo guide' }))
  view.unmount()
  render(<JummoCompanion route="media" />)
  expect(screen.queryByRole('complementary', { name: 'Jummo companion' })).not.toBeInTheDocument()
})
