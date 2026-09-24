import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import SkyExperience from './SkyExperience'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({ supabase: { rpc: vi.fn() } }))
const pending = { id: 'private', kind: 'star', status: 'pending', name: 'Owner', country: 'VN', body: 'Private wish', spectrum: 'jummo', created_at: '2026-09-20T00:00:00Z' }
const api = { demo: false, messages: [], error: '' }
const props = { api, userId: 'owner', spectra: [['all', 'All']], notice: '' }
beforeEach(() => { localStorage.clear(); supabase.rpc.mockReset() })
afterEach(() => vi.restoreAllMocks())

it('shows an owner pending star privately without including rejected stars or inflating the public count', async () => {
  supabase.rpc.mockResolvedValue({ data: [pending, { ...pending, id: 'rejected', status: 'rejected', name: 'Rejected' }], error: null })
  const user = userEvent.setup()
  render(<SkyExperience {...props} />)
  const own = await screen.findByRole('button', { name: /Your Star.*Private wish.*Awaiting approval/ })
  expect(screen.queryByRole('button', { name: /Rejected/ })).not.toBeInTheDocument()
  expect(screen.getByText(/0 public stars/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Find My Star' }))
  await waitFor(() => expect(own).toHaveFocus())
  await user.click(own)
  expect(screen.getByRole('dialog')).toHaveTextContent('Only you can see this star.')
})

it('waits for the new saved ID instead of animating an older wish with identical text', async () => {
  let resolveRefresh
  supabase.rpc.mockResolvedValueOnce({ data: [pending], error: null }).mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve }))
  const mounted = render(<SkyExperience {...props} />)
  await screen.findByRole('button', { name: /Your Star/ })
  const submission = { form: pending, previousIds: [], origin: { x: 100, y: 500 }, at: 1 }
  mounted.rerender(<SkyExperience {...props} submission={submission} />)
  expect(document.querySelector('.sky-flight')).not.toBeInTheDocument()
  await act(async () => resolveRefresh({ data: [{ ...pending, id: 'new-saved-id' }, pending], error: null }))
  await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/Your Star/), { timeout: 3000 })
  expect(document.querySelectorAll('.sky-star')).toHaveLength(2)
})

it('allows retry after owner lookup fails and does not pretend the star is missing', async () => {
  supabase.rpc.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce({ data: [pending], error: null })
  const user = userEvent.setup()
  render(<SkyExperience {...props} />)
  await user.click(await screen.findByRole('button', { name: 'Retry My Star' }))
  expect(await screen.findByRole('button', { name: 'Find My Star' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Create My Star' })).not.toBeInTheDocument()
})

it('handles fullscreen rejection with usable sky controls', async () => {
  supabase.rpc.mockResolvedValue({ data: [], error: null })
  Element.prototype.requestFullscreen = async () => { throw new Error('Not allowed') }
  const user = userEvent.setup()
  render(<SkyExperience {...props} />)
  await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
  expect(screen.getByText(/Fullscreen could not open/)).toHaveAttribute('role', 'status')
  expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeEnabled()
  delete Element.prototype.requestFullscreen
})

it('retries a failed post-submit lookup even when an older owner star is available', async () => {
  supabase.rpc.mockResolvedValueOnce({ data: [pending], error: null })
    .mockRejectedValueOnce(new Error('Offline during refresh'))
    .mockResolvedValueOnce({ data: [{ ...pending, id: 'latest', body: 'New wish' }, pending], error: null })
  const user = userEvent.setup()
  const mounted = render(<SkyExperience {...props} />)
  await screen.findByRole('button', { name: 'Find My Star' })
  mounted.rerender(<SkyExperience {...props} submission={{ form: { ...pending, body: 'New wish' }, previousIds: [], at: 2 }} />)
  await user.click(await screen.findByRole('button', { name: 'Retry My Star' }))
  await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/Your Star.*New wish/), { timeout: 3000 })
  expect(screen.queryByText(/could not load/)).not.toBeInTheDocument()
})
