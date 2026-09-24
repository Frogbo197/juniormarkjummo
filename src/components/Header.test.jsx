import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import Header from './Header'

afterEach(() => vi.unstubAllGlobals())

it('keeps the closed mobile sheet inaccessible and returns keyboard focus on Escape', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
  const user = userEvent.setup()
  render(<Header auth={{}} openAuth={vi.fn()} route="profiles/junior" />)
  const toggle = screen.getByRole('button', { name: 'Mở menu' })
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  expect(document.getElementById('main-nav')).toHaveAttribute('inert')
  toggle.focus()
  await user.keyboard('{Enter}')
  await waitFor(() => expect(screen.getByRole('link', { name: 'Studio' })).toHaveFocus())
  await user.keyboard('{Tab}')
  const archive = screen.getByRole('button', { name: 'Archive' })
  expect(archive).toHaveFocus()
  expect(archive).toHaveAttribute('aria-expanded', 'false')
  await user.keyboard('{Enter}')
  expect(screen.getByRole('link', { name: 'Profiles' })).toHaveAttribute('aria-current', 'page')
  await user.keyboard('{Escape}')
  expect(toggle).toHaveFocus()
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  expect(document.getElementById('main-nav')).toHaveAttribute('inert')
})

it('groups existing routes and marks the active Archive page', async () => {
  const user = userEvent.setup()
  render(<Header auth={{}} openAuth={vi.fn()} route="profiles/junior" />)
  const nav = screen.getByRole('navigation')
  expect(within(nav).getByRole('link', { name: 'Studio' })).toHaveAttribute('href', '#/studio')
  await user.click(within(nav).getByRole('button', { name: 'Archive' }))
  expect(within(nav).getByRole('link', { name: 'Profiles' })).toHaveAttribute('aria-current', 'page')
  expect(within(nav).getByRole('link', { name: 'Timeline / Constellation' })).toHaveAttribute('href', '#/timeline')
  await user.keyboard('{Escape}')
  expect(within(nav).getByRole('button', { name: 'Archive' })).toHaveFocus()
  expect(within(nav).getByRole('button', { name: 'Archive' })).toHaveAttribute('aria-expanded', 'false')
  await user.click(within(nav).getByRole('button', { name: 'Community' }))
  expect(within(nav).getByRole('link', { name: 'Fan Hub' })).toHaveAttribute('href', '#/projects')
  expect(within(nav).getByRole('link', { name: 'Wall' })).toHaveAttribute('href', '#/wall')
})
