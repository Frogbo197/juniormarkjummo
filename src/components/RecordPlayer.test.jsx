import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import RecordPlayer from './RecordPlayer'
import App from '../App'

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ bottom: 600 })
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
    this.dispatchEvent(new Event('play'))
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () { this.dispatchEvent(new Event('pause')) })
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete navigator.mediaSession
  window.location.hash = ''
})

it('plays audio and synchronizes the mini controls, seeking and volume', async () => {
  const { container } = render(<RecordPlayer />)
  const audio = container.querySelector('audio')
  expect(screen.getByRole('button', { name: 'Phát nhạc' })).toBeEnabled()
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Phát nhạc' })))
  expect(container.querySelector('.vinyl')).toHaveClass('playing')
  container.querySelector('#record-player').getBoundingClientRect = () => ({ bottom: -10 })
  fireEvent.scroll(window)
  const mini = screen.getByRole('region', { name: 'Trình phát thu nhỏ' })
  Object.defineProperty(audio, 'duration', { configurable: true, value: 48 })
  fireEvent.loadedMetadata(audio)
  audio.currentTime = 12
  fireEvent.timeUpdate(audio)
  expect(within(mini).getByRole('slider', { name: 'Vị trí phát nhạc' })).toHaveValue('12')
  fireEvent.change(within(mini).getByRole('slider', { name: 'Vị trí phát nhạc' }), { target: { value: '24' } })
  expect(audio.currentTime).toBe(24)
  expect(screen.getAllByRole('slider', { name: 'Vị trí phát nhạc' })[0]).toHaveValue('24')
  fireEvent.change(within(mini).getByRole('slider', { name: 'Âm lượng' }), { target: { value: '0.3' } })
  expect(audio.volume).toBe(0.3)
  fireEvent.click(within(mini).getByRole('button', { name: 'Tạm dừng' }))
  expect(container.querySelector('.vinyl')).not.toHaveClass('playing')
})

it('wraps the playlist and advances automatically when audio ends', async () => {
  const { container } = render(<RecordPlayer />)
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Bản trước' })))
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('No One Else')
  await act(async () => fireEvent.ended(container.querySelector('audio')))
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Cutie Overload')
  expect(container.querySelector('.vinyl')).toHaveClass('playing')
})

it('reports playback rejection without leaving the record spinning', async () => {
  HTMLMediaElement.prototype.play.mockRejectedValue(new Error('unavailable'))
  const { container } = render(<RecordPlayer />)
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Phát nhạc' })))
  expect(screen.getByRole('status')).toHaveTextContent('Không thể phát')
  expect(container.querySelector('.vinyl')).not.toHaveClass('playing')
})

it('resumes with one click after the browser pauses playback', async () => {
  const { container } = render(<RecordPlayer />)
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Phát nhạc' })))
  fireEvent.pause(container.querySelector('audio'))
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Phát nhạc' })))
  expect(container.querySelector('.vinyl')).toHaveClass('playing')
})

it('keeps the same playing audio, position and volume across real SPA routes', async () => {
  const { session, handlers } = installMediaSession()
  window.location.hash = '/studio'
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const { container } = render(<App />)
  const audio = container.querySelector('audio')
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Bản tiếp theo' })))
  const source = audio.src
  audio.currentTime = 42
  fireEvent.timeUpdate(audio)
  fireEvent.change(screen.getByRole('slider', { name: 'Âm lượng' }), { target: { value: '0.3' } })
  HTMLMediaElement.prototype.pause.mockClear()
  HTMLMediaElement.prototype.load.mockClear()
  HTMLMediaElement.prototype.play.mockClear()
  await act(async () => { window.location.hash = '/media'; fireEvent(window, new Event('hashchange')) })
  expect(container.querySelector('audio')).toBe(audio)
  expect(audio.currentTime).toBe(42)
  expect(audio.src).toBe(source)
  expect(audio.volume).toBe(0.3)
  const mini = screen.getByRole('region', { name: 'Trình phát thu nhỏ' })
  expect(within(mini).getByRole('button', { name: 'Tạm dừng' })).toBeInTheDocument()
  expect(mini).toHaveTextContent('Trust Me')
  await act(async () => { window.location.hash = '/studio'; fireEvent(window, new Event('hashchange')) })
  expect(container.querySelectorAll('audio')).toHaveLength(1)
  expect(container.querySelector('audio')).toBe(audio)
  expect(container.querySelector('.vinyl')).toHaveClass('playing')
  expect(audio.currentTime).toBe(42)
  expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled()
  expect(HTMLMediaElement.prototype.load).not.toHaveBeenCalled()
  expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
  expect(session.metadata.title).toContain('Trust Me')
  act(() => handlers.pause())
  expect(container.querySelector('.vinyl')).not.toHaveClass('playing')
  await act(async () => handlers.nexttrack())
  expect(screen.getByRole('heading', { name: /Let Me Love You/ })).toBeInTheDocument()
  expect(session.metadata.title).toContain('Let Me Love You')
})

function installMediaSession() {
  const handlers = {}
  const session = { metadata: null, playbackState: 'none', setActionHandler: vi.fn((action, handler) => { handlers[action] = handler }) }
  Object.defineProperty(navigator, 'mediaSession', { configurable: true, value: session })
  vi.stubGlobal('MediaMetadata', class { constructor(values) { Object.assign(this, values) } })
  return { session, handlers }
}

it('publishes metadata and handles native play, pause and track navigation', async () => {
  const { session, handlers } = installMediaSession()
  const { container, unmount } = render(<RecordPlayer />)
  expect(session.metadata?.title).toContain('Cutie Overload')
  expect(session.metadata.artist).toBe('Junior Panachai, Mark Jiruntanin')
  expect(session.metadata.album).toBeTruthy()
  expect(session.metadata.artwork[0].src).toMatch(/^https?:\/\//)
  await act(async () => handlers.play())
  expect(session.playbackState).toBe('playing')
  expect(container.querySelector('.vinyl')).toHaveClass('playing')
  act(() => handlers.pause())
  expect(session.playbackState).toBe('paused')
  await act(async () => handlers.play())
  await act(async () => handlers.nexttrack())
  expect(session.metadata.title).toContain('Trust Me')
  expect(container.querySelector('audio').src).toContain('trust-me')
  await act(async () => handlers.previoustrack())
  expect(session.metadata.title).toContain('Cutie Overload')
  unmount()
  expect(Object.values(handlers).every(handler => handler === null)).toBe(true)
  expect(session.metadata).toBeNull()
  expect(session.playbackState).toBe('none')
})

it('still plays when the browser rejects Media Session action registration', async () => {
  const { session } = installMediaSession()
  session.setActionHandler.mockImplementation(() => { throw new DOMException('Unsupported', 'NotSupportedError') })
  const { container } = render(<RecordPlayer />)
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Phát nhạc' })))
  expect(container.querySelector('.vinyl')).toHaveClass('playing')
})

it('keeps the music section anchor available during navigation into Studio', async () => {
  window.location.hash = '/media'
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const scrolledIds = []
  const original = HTMLElement.prototype.scrollIntoView
  HTMLElement.prototype.scrollIntoView = function () { scrolledIds.push(this.id) }
  try {
    render(<App />)
    await act(async () => {
      window.location.hash = '/studio?section=record-player'
      fireEvent(window, new Event('hashchange'))
    })
    expect(scrolledIds).toContain('record-player')
    expect(document.querySelectorAll('#record-player')).toHaveLength(1)
  } finally {
    if (original) HTMLElement.prototype.scrollIntoView = original
    else delete HTMLElement.prototype.scrollIntoView
  }
})
