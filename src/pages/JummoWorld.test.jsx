import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getLanguage, setLanguage } from '../i18n/language'
import JummoWorld from './JummoWorld'
import JummoRoom from './JummoRoom'
import { BED_PATH, HOME, JUMMO_ART, travelDuration } from '../features/jummo/roomScene'

const previousLanguage = getLanguage()
beforeEach(() => setLanguage('en'))
afterEach(() => {
  setLanguage(previousLanguage)
  vi.restoreAllMocks()
  vi.useRealTimers()
  delete document.documentElement.dataset.reduceMotion
})

function renderRoom() {
  return render(<JummoRoom />)
}

it('renders a full room without the old page sections or activity switcher', () => {
  renderRoom()

  const room = screen.getByRole('region', { name: "Jummo's Room" })
  expect(room).toBeInTheDocument()
  expect(room.querySelector('.two-columns, .three-columns, .image-story, .quiz-panel')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Window: Day, clear' })).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'Jummo mood' })).not.toBeInTheDocument()
  expect(screen.queryByText('Download Jummo Gifts')).not.toBeInTheDocument()
  expect(screen.queryByText('Keepsake Card Collection')).not.toBeInTheDocument()
})

it('changes the room environment through the window, including rain without a rain toggle', async () => {
  const user = userEvent.setup()
  renderRoom()

  const window = screen.getByRole('button', { name: 'Window: Day, clear' })
  await user.click(window)
  expect(screen.getByRole('button', { name: 'Window: Evening, clear' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Window: Evening, clear' }))
  await user.click(screen.getByRole('button', { name: 'Window: Night, clear' }))
  const rainyDay = screen.getByRole('button', { name: 'Window: Day, rainy' })
  await user.click(rainyDay)

  const rain = document.querySelector('.jr-window-rain')
  expect(rain).toBeInTheDocument()
  expect(screen.getByRole('region', { name: "Jummo's Room" })).toHaveAttribute('data-rain', 'true')
  expect(screen.queryByRole('button', { name: 'Start Jummo Rain' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Stop Jummo Rain' })).not.toBeInTheDocument()
})

it('opens the supplied dance GIF in a large dismissible dialog', async () => {
  const user = userEvent.setup()
  renderRoom()

  await user.click(screen.getByRole('button', { name: 'Radio' }))
  const dialog = screen.getByRole('dialog', { name: 'Dance with Jummo' })
  expect(within(dialog).getByRole('img', { name: 'Jummo dancing' })).toHaveAttribute('src', '/images/jummo-room/dancing.gif')
  await user.click(within(dialog).getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Jummo is ready to play')
})

it('reads the book and diary and returns to idle when closed', async () => {
  const user = userEvent.setup()
  renderRoom()

  await user.click(screen.getByRole('button', { name: 'Diary' }))
  expect(screen.getByRole('dialog', { name: 'Your diary' })).toHaveTextContent('Sign in')
  await user.click(screen.getByRole('button', { name: 'Close' }))
  await user.click(screen.getByRole('button', { name: 'Book' }))
  expect(within(screen.getByRole('dialog', { name: 'Read with Jummo' })).getByRole('img')).toHaveAttribute('src', '/images/jummo-room/reading.gif')
  await user.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.getByRole('status')).toHaveTextContent('Jummo is ready to play')
})

it('opens the bookshelf as an in-room book view and starts reading from a book', async () => {
  const user = userEvent.setup()
  renderRoom()

  await user.click(screen.getByRole('button', { name: 'Bookshelf' }))
  const shelf = screen.getByRole('dialog', { name: 'Jummo’s bookshelf' })
  await user.click(within(shelf).getByRole('button', { name: 'Jummo Storybook' }))

  expect(screen.queryByRole('dialog', { name: 'Jummo’s bookshelf' })).not.toBeInTheDocument()
  expect(within(screen.getByRole('dialog', { name: 'Read with Jummo' })).getByRole('img')).toHaveAttribute('src', '/images/jummo-room/reading.gif')
})

it('captures a snapshot of the room and unlocks the secret letter after five taps on Jummo', async () => {
  const user = userEvent.setup()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: vi.fn(),
    fillStyle: '',
    drawImage: vi.fn(),
    save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
  })
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(435)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,room')
  renderRoom()

  await user.click(screen.getByRole('button', { name: 'Camera' }))
  expect(screen.getByRole('img', { name: 'Room snapshot' })).toHaveAttribute('src', 'data:image/png;base64,room')
  expect(screen.getByRole('link', { name: 'Save snapshot' })).toHaveAttribute('download', 'jummos-room.png')
  await user.click(screen.getByRole('button', { name: 'Close' }))

  const jummo = screen.getByRole('button', { name: 'Jummo' })
  for (let tap = 0; tap < 4; tap += 1) await user.click(jummo)
  expect(screen.queryByRole('dialog', { name: 'Secret letter' })).not.toBeInTheDocument()
  await user.click(jummo)
  expect(screen.getByRole('dialog', { name: 'Secret letter' })).toHaveTextContent('Dear little stars')
})

it('walks to the bed before sleeping, prevents competing actions, and walks home after waking', () => {
  vi.useFakeTimers()
  renderRoom()
  const region = screen.getByRole('region', { name: "Jummo's Room" })
  fireEvent.click(screen.getByRole('button', { name: 'Bed' }))
  expect(within(screen.getByRole('dialog', { name: 'Sweet dreams, Jummo' })).getByRole('img')).toHaveAttribute('src', '/images/jummo-room/sleeping.gif')
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(region).toHaveAttribute('data-activity', 'moving')
  expect(screen.queryByRole('button', { name: 'Wake up' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Radio' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Camera' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Bed' }))
  let from = HOME
  for (const to of BED_PATH) {
    act(() => vi.advanceTimersByTime(travelDuration(from, to)))
    from = to
  }
  expect(region).toHaveAttribute('data-activity', 'sleeping')
  expect(screen.getByRole('img', { name: 'Jummo sleeping' })).toHaveAttribute('src', JUMMO_ART)
  expect(screen.getByRole('button', { name: 'Book' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Camera' })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Wake up' }))
  expect(region).toHaveAttribute('data-activity', 'returning')
  act(() => vi.advanceTimersByTime(10000))
  expect(region).toHaveAttribute('data-activity', 'idle')
  expect(document.querySelector('.jr-character')).toHaveStyle({ left: `${HOME.x}%`, top: `${HOME.y}%` })
  expect(screen.getByRole('button', { name: 'Radio' })).toBeEnabled()
})

it('skips travel for reduced motion and preserves sleep when switching language or zooming', () => {
  vi.useFakeTimers()
  document.documentElement.dataset.reduceMotion = 'true'
  renderRoom()
  fireEvent.click(screen.getByRole('button', { name: 'Go to bed' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.getByRole('button', { name: 'Wake up' })).toBeEnabled()
  expect(vi.getTimerCount()).toBe(1) // Shared care refresh, no movement timer.
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
  expect(screen.getByRole('button', { name: 'Zoom out' })).toHaveAttribute('aria-pressed', 'true')
  act(() => setLanguage('vi'))
  fireEvent.click(screen.getByRole('button', { name: 'Đánh thức' }))
  expect(screen.getByRole('region', { name: 'Phòng của Jummo' })).toHaveAttribute('data-activity', 'idle')
})

it('cleans up pending movement when leaving the room', () => {
  vi.useFakeTimers()
  const view = renderRoom()
  fireEvent.click(screen.getByRole('button', { name: 'Bed' }))
  expect(vi.getTimerCount()).toBe(2) // Movement plus the shared care refresh.
  view.unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('shows a retry message if the room art has not loaded for a snapshot', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({})
  renderRoom()
  fireEvent.click(screen.getByRole('button', { name: 'Camera' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Let the room finish loading')
  expect(screen.queryByRole('link', { name: 'Save snapshot' })).not.toBeInTheDocument()
})

it('keeps the original World features and opens the room only via Room Tour', async () => {
  const user = userEvent.setup()
  const openPhoto = vi.fn()
  render(<JummoWorld openPhoto={openPhoto} />)
  expect(screen.queryByRole('region', { name: "Jummo's Room" })).not.toBeInTheDocument()
  expect(screen.getByRole('group', { name: 'Jummo mood' })).toBeInTheDocument()
  expect(screen.getByText('Download Jummo Gifts')).toBeInTheDocument()
  expect(document.querySelector('.quiz-panel')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Start Jummo Rain' }))
  await user.click(screen.getByRole('button', { name: 'Tap Jummo to open the letter' }))
  await user.click(screen.getByRole('button', { name: /Room Tour/ }))
  expect(screen.getByRole('region', { name: "Jummo's Room" })).toBeInTheDocument()
  expect(screen.queryByRole('group', { name: 'Jummo mood' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Back to Jummo World/ }))
  expect(screen.getByRole('button', { name: 'Stop Jummo Rain' })).toHaveAttribute('aria-pressed', 'true')
  expect(document.querySelector('.mascot-stage')).toHaveTextContent('1/5')
  await user.click(screen.getByRole('button', { name: /An embrace with our little friend/ }))
  expect(openPhoto).toHaveBeenCalledWith(expect.objectContaining({ src: '/images/junior-mark.png' }))
})
