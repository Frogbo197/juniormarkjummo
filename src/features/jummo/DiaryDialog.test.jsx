import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { AuthContext } from '../auth/authContext'
import { apiClient } from '../../lib/apiClient'
import { setLanguage } from '../../i18n/language'
import DiaryDialog from './DiaryDialog'

vi.mock('../../lib/apiClient', () => ({ apiClient: { from: vi.fn() } }))
let replies, queries
beforeEach(() => {
  setLanguage('en')
  replies = []; queries = []
  apiClient.from.mockReset().mockImplementation(() => {
    const reply = replies.shift() ?? { data: [] }
    const query = {}
    for (const method of ['select', 'eq', 'order', 'range', 'insert', 'update', 'single']) query[method] = vi.fn(() => query)
    query.then = (resolve, reject) => Promise.resolve(reply).then(resolve, reject)
    queries.push(query)
    return query
  })
})
afterEach(() => setLanguage('vi'))
const saved = { id: 'note-1', title: 'A good day', body: 'My private words', updated_at: '2026-10-16T10:00:00Z' }
function view(user = 'user-a', onClose = vi.fn(), openAuth = vi.fn()) {
  return <AuthContext.Provider value={{ loading: false, session: user ? { user: { id: user } } : null }}><DiaryDialog onClose={onClose} openAuth={openAuth} /></AuthContext.Provider>
}
async function fillDraft() {
  fireEvent.change(await screen.findByLabelText('Title'), { target: { value: saved.title } })
  fireEvent.change(screen.getByLabelText('How was your day?'), { target: { value: saved.body } })
}

it('requires sign-in before reading or writing private diary data', () => {
  const close = vi.fn(), openAuth = vi.fn()
  render(view(null, close, openAuth))
  expect(apiClient.from).not.toHaveBeenCalled()
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Sign in to write' }))
  expect(close).toHaveBeenCalledOnce()
  expect(openAuth).toHaveBeenCalledWith('signin')
})

it('saves to the signed-in account and reloads saved entries when reopened', async () => {
  replies.push({ data: [] }, { data: saved }, { data: [saved] })
  const first = render(view())
  await fillDraft()
  fireEvent.click(screen.getByRole('button', { name: 'Save diary' }))
  expect(await screen.findByText('Private diary entry saved.')).toBeInTheDocument()
  expect(apiClient.from).toHaveBeenCalledWith('user_notes')
  expect(queries[0].eq).toHaveBeenCalledWith('user_id', 'user-a')
  expect(queries[1].insert).toHaveBeenCalledWith({ title: saved.title, body: saved.body, user_id: 'user-a' })
  first.unmount()
  render(view())
  fireEvent.click(await screen.findByRole('button', { name: /A good day/ }))
  expect(screen.getByLabelText('How was your day?')).toHaveValue(saved.body)
})

it('updates an existing entry with both note and owner filters', async () => {
  replies.push({ data: [saved] }, { data: { ...saved, body: 'Updated words' } })
  render(view())
  fireEvent.click(await screen.findByRole('button', { name: /A good day/ }))
  fireEvent.change(screen.getByLabelText('How was your day?'), { target: { value: 'Updated words' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save diary' }))
  await screen.findByText('Private diary entry saved.')
  expect(queries[1].update).toHaveBeenCalledWith({ title: saved.title, body: 'Updated words' })
  expect(queries[1].eq).toHaveBeenCalledWith('id', saved.id)
  expect(queries[1].eq).toHaveBeenCalledWith('user_id', 'user-a')
})

it('keeps a draft after save failure and blocks duplicate in-flight submissions', async () => {
  let finish
  replies.push({ data: [] }, new Promise((resolve) => { finish = resolve }))
  render(view())
  await fillDraft()
  fireEvent.click(screen.getByRole('button', { name: 'Save diary' }))
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Saving…' }))
  expect(queries).toHaveLength(2)
  await act(async () => finish({ error: { message: 'offline' } }))
  expect(screen.getByRole('alert')).toHaveTextContent('Your draft is still here')
  expect(screen.getByLabelText('How was your day?')).toHaveValue(saved.body)
  expect(screen.getByRole('button', { name: 'Save diary' })).toBeEnabled()
})

it('asks before discarding an unsaved draft and keeps it when cancelled', async () => {
  const close = vi.fn()
  render(view('user-a', close))
  await fillDraft()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(close).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Keep writing' }))
  expect(screen.getByLabelText('How was your day?')).toHaveValue(saved.body)
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
  expect(close).toHaveBeenCalledOnce()
})

it('clears private content on account changes and ignores late responses', async () => {
  let finish
  replies.push(new Promise((resolve) => { finish = resolve }), { data: [] })
  const component = render(view('user-a'))
  component.rerender(view('user-b'))
  await screen.findByLabelText('Title')
  await act(async () => finish({ data: [saved] }))
  expect(screen.queryByRole('button', { name: /A good day/ })).not.toBeInTheDocument()
  expect(queries[1].eq).toHaveBeenCalledWith('user_id', 'user-b')
  await fillDraft()
  component.rerender(view(null))
  expect(screen.queryByDisplayValue(saved.body)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sign in to write' })).toBeInTheDocument()
})

it('shows load failures with a retry and does not offer an empty editor as saved data', async () => {
  replies.push({ error: { message: 'offline' } }, { data: [saved] })
  render(view())
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your diary')
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await waitFor(() => expect(screen.getByRole('button', { name: /A good day/ })).toBeInTheDocument())
})
