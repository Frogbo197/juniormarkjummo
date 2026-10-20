import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../i18n/language'
import JummoRoom from '../../pages/JummoRoom'
import { CARE_KEY, DEFAULT_CARE, readCare } from './careState'
import { DINING } from './diningScene'
// Isolate meal rewards here; real-time decay is covered by careState.test.jsx.
vi.mock('./careConfig', async (original) => {
  const module = await original()
  return { CARE_CONFIG: { ...module.CARE_CONFIG, decay: { mood: 0, fullness: 0, cleanliness: 0, energy: 0 } } }
})

beforeEach(() => { localStorage.clear(); setLanguage('en'); vi.useFakeTimers() })
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); localStorage.clear(); setLanguage('vi') })
function enter() {
  const result = render(<JummoRoom />)
  fireEvent.click(screen.getByRole('button', { name: 'Dining room' }))
  return result
}
function value() { return Number(screen.getByRole('progressbar', { name: 'Fullness' }).getAttribute('aria-valuenow')) }
function finish() { act(() => vi.advanceTimersByTime(DINING.mealDuration)) }
function pointer(target, type, x, y) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 })
  Object.defineProperty(event, 'pointerId', { value: 7 })
  fireEvent(target, event)
}
function prepareDrag() {
  const food = screen.getByRole('button', { name: /Apple/ })
  food.setPointerCapture = vi.fn()
  vi.spyOn(screen.getByTestId('dining-scene'), 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 1000, height: 666 })
  return food
}
it('finishes three meals from 40 to 100, locks eating and persists across rooms and remounts', () => {
  const view = enter()
  expect(screen.getAllByRole('progressbar')).toHaveLength(4)
  expect(value()).toBe(40)
  fireEvent.click(screen.getByRole('button', { name: /Apple/ }))
  for (const expected of [60, 80, 100]) {
    fireEvent.click(screen.getByRole('button', { name: 'Feed', exact: true }))
    expect(value()).toBe(expected - 20)
    expect(screen.getByRole('button', { name: 'Back to room' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Apple/ })).toBeDisabled()
    finish(); expect(value()).toBe(expected)
    finish(); expect(value()).toBe(expected)
  }
  expect(screen.getByRole('button', { name: 'Feed', exact: true })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('Jummo is full!')
  fireEvent.click(screen.getByRole('button', { name: 'Back to room' }))
  expect(value()).toBe(100)
  view.unmount(); render(<JummoRoom />)
  expect(value()).toBe(100)
  expect(readCare()).toEqual({ ...DEFAULT_CARE, fullness: 100 })
})
it('clamps 90 plus one meal to 100 and reports actual gain', () => {
  localStorage.setItem(CARE_KEY, JSON.stringify({ version: 1, stats: { ...DEFAULT_CARE, fullness: 90 } }))
  enter(); fireEvent.click(screen.getByRole('button', { name: /Rice ball/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Feed', exact: true })); finish()
  expect(value()).toBe(100)
  expect(screen.getByRole('status')).toHaveTextContent('+10 fullness')
})
it('opens mouth throughout dragging, restores outside drops, and consumes one serving per meal', () => {
  enter(); const food = prepareDrag()
  pointer(food, 'pointerdown', 100, 700)
  pointer(food, 'pointermove', 495, 360)
  expect(screen.getByRole('img', { name: 'Jummo opens mouth' })).toBeInTheDocument()
  finish(); expect(value()).toBe(40)
  pointer(food, 'pointermove', 100, 100)
  expect(screen.getByRole('img', { name: 'Jummo opens mouth' })).toBeInTheDocument()
  expect(food).toHaveClass('is-away')
  expect(document.querySelectorAll('.jr-drag-food')).toHaveLength(1)
  pointer(food, 'pointerup', 100, 100); finish(); expect(value()).toBe(40)
  pointer(food, 'pointerdown', 100, 700)
  pointer(food, 'pointerup', 495, 360)
  expect(screen.getByRole('img', { name: 'Jummo eating' })).toBeInTheDocument()
  pointer(food, 'lostpointercapture', 495, 360)
  finish(); expect(value()).toBe(60)
  expect(food).not.toHaveClass('is-away')
  finish(); expect(value()).toBe(60)
})
it.each(['pointercancel', 'lostpointercapture'])('%s cancels dragging without awarding food', (type) => {
  enter(); const food = prepareDrag()
  pointer(food, 'pointerdown', 100, 700); pointer(food, 'pointermove', 495, 360)
  pointer(food, type, 495, 360); finish()
  expect(value()).toBe(40)
  expect(screen.getByRole('img', { name: 'Jummo in the dining room' })).toBeInTheDocument()
  expect(document.querySelector('.jr-drag-food')).toBeNull()
})
it('unmounting mid-meal cancels its timer and does not save unearned progress', () => {
  const view = enter()
  fireEvent.click(screen.getByRole('button', { name: /Egg/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Feed', exact: true }))
  view.unmount(); finish()
  expect(readCare()).toEqual(DEFAULT_CARE)
  enter(); expect(screen.getByRole('img', { name: 'Jummo in the dining room' })).toBeInTheDocument()
})
it('handles malformed storage and clamps valid numeric saved stats', () => {
  for (const broken of ['{', 'null', '{"version":1,"stats":{}}']) {
    localStorage.setItem(CARE_KEY, broken); expect(readCare()).toEqual(DEFAULT_CARE)
  }
  localStorage.setItem(CARE_KEY, JSON.stringify({ version: 1, stats: { mood: -5, fullness: 110, cleanliness: 80, energy: 80 } }))
  expect(readCare()).toEqual({ mood: 0, fullness: 100, cleanliness: 80, energy: 80 })
})
it('requires waking before entering the dining room', () => {
  document.documentElement.dataset.reduceMotion = 'true'
  render(<JummoRoom />)
  fireEvent.click(screen.getByRole('button', { name: 'Go to bed' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  fireEvent.click(screen.getByRole('button', { name: 'Dining room' }))
  expect(screen.getByRole('alert')).toHaveTextContent('Wake Jummo')
  expect(screen.queryByTestId('dining-scene')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Wake up' }))
  fireEvent.click(screen.getByRole('button', { name: 'Dining room' }))
  expect(screen.getByTestId('dining-scene')).toBeInTheDocument()
  delete document.documentElement.dataset.reduceMotion
})

it('shows three mobile dishes and cycles through all five with compact controls', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
  enter()
  expect(document.querySelectorAll('.jr-table-food')).toHaveLength(3)
  expect(screen.queryByRole('button', { name: 'Feed', exact: true })).toBeNull()
  const names = new Set()
  for (let i = 0; i < 5; i++) {
    document.querySelectorAll('.jr-table-food').forEach((el) => names.add(el.getAttribute('aria-label')))
    fireEvent.click(screen.getByRole('button', { name: 'Next foods' }))
  }
  expect(names.size).toBe(5)
  vi.unstubAllGlobals()
})
