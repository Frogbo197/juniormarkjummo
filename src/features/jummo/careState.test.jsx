import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { advanceCare, CARE_KEY, DEFAULT_CARE, loadCare, useCareState } from './careState'
import JummoRoom from '../../pages/JummoRoom'
import { setLanguage } from '../../i18n/language'

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(100000000); localStorage.clear(); setLanguage('en') })
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); delete document.documentElement.dataset.reduceMotion })
function hidden(value) {
  Object.defineProperty(document, 'hidden', { configurable: true, value })
  fireEvent(document, new Event('visibilitychange'))
}
afterEach(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }) })
it('applies the four real-time decay rates and retains fractions', () => {
  expect(advanceCare(DEFAULT_CARE, 1800000)).toEqual({ mood: 76, fullness: 35, cleanliness: 77, energy: 75 })
  expect(advanceCare(DEFAULT_CARE, 900000).fullness).toBe(37.5)
  expect(advanceCare(DEFAULT_CARE, -1000)).toEqual(DEFAULT_CARE)
})
it.each(['reading', 'dancing', 'stargazing'])('%s earns mood only for elapsed active time', (activity) => {
  const intervals = vi.spyOn(window, 'setInterval')
  const clearInterval = vi.spyOn(window, 'clearInterval')
  const view = renderHook(({ mode }) => useCareState(mode), { initialProps: { mode: 'idle' } })
  view.rerender({ mode: activity })
  expect(view.result.current.stats.mood).toBe(80)
  act(() => vi.advanceTimersByTime(10000))
  expect(view.result.current.stats.mood).toBeCloseTo(82)
  view.rerender({ mode: 'idle' })
  act(() => vi.advanceTimersByTime(10000))
  expect(view.result.current.stats.mood).toBeCloseTo(82 - 4 / 180)
  expect(vi.getTimerCount()).toBe(1)
  const timer = intervals.mock.results[0].value
  view.unmount(); expect(clearInterval).toHaveBeenCalledWith(timer)
  const saved = localStorage.getItem(CARE_KEY)
  act(() => vi.advanceTimersByTime(60000))
  expect(localStorage.getItem(CARE_KEY)).toBe(saved)
})
it('settles old rates on switching and never grants a click bonus', () => {
  const view = renderHook(({ mode }) => useCareState(mode), { initialProps: { mode: 'idle' } })
  for (let i = 0; i < 10; i++) { view.rerender({ mode: 'reading' }); view.rerender({ mode: 'idle' }) }
  expect(view.result.current.stats.mood).toBe(80)
  view.rerender({ mode: 'reading' }); act(() => vi.advanceTimersByTime(500))
  view.rerender({ mode: 'idle' }); expect(view.result.current.stats.mood).toBeCloseTo(80.1)
  expect(vi.getTimerCount()).toBe(1)
})
it('rewards sleep only after arrival, stops on waking and clamps at 100', () => {
  expect(advanceCare(DEFAULT_CARE, 60000, 'moving').energy).toBeLessThan(80)
  expect(advanceCare(DEFAULT_CARE, 60000, 'sleeping').energy).toBe(85)
  expect(advanceCare(DEFAULT_CARE, 600000, 'sleeping').energy).toBe(100)
  const view = renderHook(({ mode }) => useCareState(mode), { initialProps: { mode: 'sleeping' } })
  act(() => vi.advanceTimersByTime(60000)); expect(view.result.current.stats.energy).toBeCloseTo(85)
  view.rerender({ mode: 'returning' }); act(() => vi.advanceTimersByTime(60000))
  expect(view.result.current.stats.energy).toBeCloseTo(85 - 5 / 30)
})
it('settles one capped absence, resumes idle and does not count it twice', () => {
  const view = renderHook(() => useCareState('reading'))
  act(() => vi.advanceTimersByTime(10000)); expect(view.result.current.stats.mood).toBeCloseTo(82)
  act(() => hidden(true))
  act(() => vi.setSystemTime(Date.now() + 24 * 3600000))
  act(() => hidden(false))
  expect(view.result.current.stats.mood).toBeCloseTo(52)
  expect(view.result.current.stats.fullness).toBeCloseTo(40 - 5 / 180 - 30)
  const settled = view.result.current.stats
  act(() => hidden(false)); expect(view.result.current.stats).toEqual(settled)
  act(() => vi.advanceTimersByTime(10000))
  expect(view.result.current.stats.mood).toBeLessThan(52)
  view.unmount()
  const reloaded = renderHook(() => useCareState())
  expect(reloaded.result.current.stats.mood).toBeCloseTo(52 - 4 / 180)
})
it('migrates old saves and ignores backwards clock movement', () => {
  localStorage.setItem(CARE_KEY, JSON.stringify({ version: 1, stats: DEFAULT_CARE }))
  expect(loadCare().stats).toEqual(DEFAULT_CARE)
  const view = renderHook(() => useCareState('reading'))
  act(() => vi.setSystemTime(Date.now() - 60000))
  act(() => vi.advanceTimersByTime(10000))
  expect(view.result.current.stats).toEqual(DEFAULT_CARE)
})
it('hidden page closes an activity and cancels an unfinished meal', () => {
  render(<JummoRoom />)
  fireEvent.click(screen.getByRole('button', { name: 'Book', exact: true }))
  act(() => hidden(true)); act(() => hidden(false))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('ready to play')
  fireEvent.click(screen.getByRole('button', { name: 'Dining room' }))
  fireEvent.click(screen.getByRole('button', { name: /Apple/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Feed', exact: true }))
  act(() => hidden(true)); act(() => vi.advanceTimersByTime(5000)); act(() => hidden(false))
  expect(screen.getByRole('img', { name: 'Jummo in the dining room' })).toBeInTheDocument()
  expect(Number(screen.getByRole('progressbar', { name: 'Fullness' }).getAttribute('aria-valuenow'))).toBeLessThanOrEqual(40)
})
