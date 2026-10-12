import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { getLanguage, setLanguage } from '../i18n/language'
import JummoWorld from './JummoWorld'

const previousLanguage = getLanguage()
beforeEach(() => setLanguage('en'))
afterEach(() => {
  setLanguage(previousLanguage)
  vi.restoreAllMocks()
})

function renderRoom() {
  return render(<JummoWorld openPhoto={() => {}} showInfo={() => {}} />)
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

  const rain = document.querySelector('.jummo-rain')
  expect(rain).toBeInTheDocument()
  expect(rain.querySelectorAll('img')).toHaveLength(18)
  expect(rain.querySelector('img')).toHaveAttribute('src', '/images/jummo_rain.png')
  expect(rain.querySelector('img').style.animationDuration).toMatch(/^\d+(\.\d+)?s$/)
  expect(rain.querySelector('img').style.getPropertyValue('--drop-left')).toMatch(/^\d+(\.\d+)?vw$/)
  expect(screen.queryByRole('button', { name: 'Start Jummo Rain' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Stop Jummo Rain' })).not.toBeInTheDocument()
})

it('uses the radio to put Jummo in listening and dancing states', async () => {
  const user = userEvent.setup()
  renderRoom()

  await user.click(screen.getByRole('button', { name: 'Radio' }))
  expect(screen.getByRole('img', { name: 'Jummo listening' })).toHaveAttribute('src', '/jummo_dance.gif')
  await user.click(screen.getByRole('button', { name: 'Radio' }))
  expect(screen.getByRole('img', { name: 'Jummo dancing' })).toHaveAttribute('src', '/jummo_dance.gif')
})

it('uses the book and bed to read and sleep, and the diary opens its content in the room', async () => {
  const user = userEvent.setup()
  renderRoom()

  await user.click(screen.getByRole('button', { name: 'Diary' }))
  expect(screen.getByRole('dialog', { name: 'Jummo’s diary' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Close' }))
  await user.click(screen.getByRole('button', { name: 'Book' }))
  expect(screen.getByRole('img', { name: 'Jummo reading' })).toHaveAttribute('src', '/jummo_read.gif')
  expect(screen.getByRole('dialog', { name: 'Jummo’s diary' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Close' }))
  await user.click(screen.getByRole('button', { name: 'Bed' }))
  expect(screen.getByRole('img', { name: 'Jummo sleeping' })).toHaveAttribute('src', '/sleep_mc.png')
})

it('opens the bookshelf as an in-room book view and starts reading from a book', async () => {
  const user = userEvent.setup()
  renderRoom()

  await user.click(screen.getByRole('button', { name: 'Bookshelf' }))
  const shelf = screen.getByRole('dialog', { name: 'Jummo’s bookshelf' })
  await user.click(within(shelf).getByRole('button', { name: 'Jummo Storybook' }))

  expect(screen.queryByRole('dialog', { name: 'Jummo’s bookshelf' })).not.toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Jummo reading' })).toBeInTheDocument()
  expect(screen.getByRole('dialog', { name: 'Jummo’s diary' })).toBeInTheDocument()
})

it('captures a snapshot of the room and unlocks the secret letter after five taps on Jummo', async () => {
  const user = userEvent.setup()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: vi.fn(),
    fillStyle: '',
    drawImage: vi.fn(),
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,room')
  renderRoom()

  await user.click(screen.getByRole('button', { name: 'Camera' }))
  expect(screen.getByRole('img', { name: 'Room snapshot' })).toHaveAttribute('src', 'data:image/png;base64,room')
  expect(screen.getByRole('link', { name: 'Save snapshot' })).toHaveAttribute('download', 'jummos-room.png')

  const jummo = screen.getByRole('button', { name: 'Jummo' })
  for (let tap = 0; tap < 4; tap += 1) await user.click(jummo)
  expect(screen.queryByRole('dialog', { name: 'Secret letter' })).not.toBeInTheDocument()
  await user.click(jummo)
  expect(screen.getByRole('dialog', { name: 'Secret letter' })).toHaveTextContent('Dear little stars')
})
