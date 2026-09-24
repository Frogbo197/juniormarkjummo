import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../features/auth/authContext'
import Community from './Community'

vi.mock('../lib/supabase', () => ({ supabase: null }))
vi.mock('../lib/archive', async (original) => ({ ...await original(), playNote: async () => {} }))

const star = { id: 'saved-star', name: 'Moon', country: 'VN', body: 'Wishing you joy', spectrum: 'mark', created_at: '2026-09-20T00:00:00Z' }
function mount() { return render(<AuthContext.Provider value={{ session: null }}><Community /></AuthContext.Provider>) }
beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('opens the existing validated form in a dismissible drawer', async () => {
  const user = userEvent.setup()
  mount()
  expect(screen.queryAllByRole('textbox')).toHaveLength(0)
  await user.click(screen.getByRole('button', { name: 'Create My Star' }))
  const drawer = screen.getByRole('dialog', { name: 'Leave a Star' })
  await user.click(within(drawer).getByRole('button', { name: /Lưu nguyện/ }))
  expect(within(drawer).getByRole('alert')).toBeInTheDocument()
  expect(localStorage.getItem('jm-demo-star')).toBeNull()
  expect(document.querySelector('.sky-flight')).not.toBeInTheDocument()
  fireEvent(drawer, new Event('cancel', { bubbles: false, cancelable: true }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('finds the saved local star through another filter and keeps fan stars clickable', async () => {
  localStorage.setItem('jm-demo-star', JSON.stringify([star, { ...star, id: 'fan', name: 'Sun', spectrum: 'junior' }]))
  const user = userEvent.setup()
  mount()
  await user.click(screen.getByRole('button', { name: 'Filter' }))
  await user.click(screen.getByRole('button', { name: 'Junior Ánh Dương' }))
  await user.click(screen.getByRole('button', { name: 'Find My Star' }))
  const own = screen.getByRole('button', { name: /Your Star.*Moon/ })
  await waitFor(() => expect(own).toHaveFocus())
  await user.click(screen.getByRole('button', { name: /Star from Sun/ }))
  expect(screen.getByRole('dialog', { name: 'Sun' })).toHaveTextContent(star.body)
})

it('reveals and focuses the newly saved star with reduced motion', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }))
  const user = userEvent.setup()
  mount()
  await user.click(screen.getByRole('button', { name: '+ Leave a Star' }))
  const drawer = screen.getByRole('dialog', { name: 'Leave a Star' })
  const inputs = within(drawer).getAllByRole('textbox')
  await user.type(inputs[0], 'Starlight')
  await user.type(inputs[1], 'Vietnam')
  await user.type(inputs[2], 'A bright tomorrow')
  await user.click(within(drawer).getByRole('button', { name: /Lưu nguyện/ }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(document.querySelector('.sky-flight')).toBeInTheDocument()
  expect(document.querySelector('.sky-flight').parentElement).toBe(document.body)
  expect(document.querySelector('.sky-star.is-mine')).toHaveClass('is-arriving')
  const own = await screen.findByRole('button', { name: /Your Star.*Starlight/ })
  await waitFor(() => expect(own).toHaveFocus())
  expect(JSON.parse(localStorage.getItem('jm-demo-star'))[0].body).toBe('A bright tomorrow')
  expect(document.querySelector('.sky-flight')).not.toBeInTheDocument()
})

it('does not launch when saving a validated wish fails', async () => {
  const user = userEvent.setup()
  mount()
  await user.click(screen.getByRole('button', { name: '+ Leave a Star' }))
  const inputs = screen.getAllByRole('textbox')
  await user.type(inputs[0], 'Starlight')
  await user.type(inputs[1], 'Vietnam')
  await user.type(inputs[2], 'A wish that cannot be saved')
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked') })
  await user.click(screen.getByRole('button', { name: /Lưu nguyện/ }))
  expect(screen.getByRole('alert')).toBeInTheDocument()
  expect(document.querySelector('.sky-flight')).not.toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('tracks native fullscreen entry and Escape exit', async () => {
  let fullscreen = null
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreen })
  Element.prototype.requestFullscreen = async function () { fullscreen = this; document.dispatchEvent(new Event('fullscreenchange')) }
  document.exitFullscreen = async () => { fullscreen = null; document.dispatchEvent(new Event('fullscreenchange')) }
  const user = userEvent.setup()
  mount()
  await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
  expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument()
  expect(fullscreen).toContainElement(screen.getByRole('button', { name: 'My Star' }))
  await user.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
  await act(() => document.exitFullscreen())
  expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument()
  delete Element.prototype.requestFullscreen
})

it('keeps the Wall form inline and its submissions separate from sky stars', async () => {
  const user = userEvent.setup()
  render(<AuthContext.Provider value={{ session: null }}><Community kind="note" /></AuthContext.Provider>)
  expect(screen.queryByRole('button', { name: '+ Leave a Star' })).not.toBeInTheDocument()
  const inputs = screen.getAllByRole('textbox')
  await user.type(inputs[0], 'Wall Fan')
  await user.type(inputs[1], 'VN')
  await user.type(inputs[2], 'A note for the wall')
  await user.click(screen.getByRole('button', { name: /Lưu nguyện/ }))
  expect(JSON.parse(localStorage.getItem('jm-demo-note'))[0].body).toBe('A note for the wall')
  expect(localStorage.getItem('jm-demo-star')).toBeNull()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
