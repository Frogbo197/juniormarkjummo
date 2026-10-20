import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import BathRoom from './BathRoom'
import JummoRoom from '../../pages/JummoRoom'
import { CARE_KEY, DEFAULT_CARE, readCare } from './careState'
import { setLanguage } from '../../i18n/language'

beforeEach(() => { vi.useFakeTimers(); setLanguage('en'); localStorage.clear() })
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); setLanguage('vi'); localStorage.clear() })
function tick(ms = 2000) { act(() => vi.advanceTimersByTime(ms)) }
function pointer(target, type, x, y) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 })
  Object.defineProperty(event, 'pointerId', { value: 1 })
  fireEvent(target, event)
}
function prepare() {
  const shower = screen.getByRole('button', { name: 'Shower' })
  shower.setPointerCapture = vi.fn()
  vi.spyOn(screen.getByTestId('bath-scene'), 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 1000, height: 562.5 })
  return shower
}
function soapAll() {
  const soap = screen.getByRole('button', { name: 'Soap bottle' })
  soap.setPointerCapture = vi.fn()
  pointer(soap, 'pointerdown', 200, 377)
  for (const y of [39, 50, 61]) {
    for (const x of [39, 46, 53, 60]) pointer(soap, 'pointermove', x * 10, y * 5.625)
  }
  pointer(soap, 'pointerup', 600, 343)
}
it('rinses only under the shower, stops on cancel, and rewards once after all foam dissolves', () => {
  const completeBath = vi.fn()
  render(<BathRoom stats={DEFAULT_CARE} completeBath={completeBath} onBack={() => {}} />)
  const shower = prepare()
  soapAll()
  pointer(shower, 'pointerdown', 100, 100); tick()
  expect(completeBath).not.toHaveBeenCalled()
  pointer(shower, 'pointermove', 390, 112); tick()
  expect(completeBath).not.toHaveBeenCalled()
  pointer(shower, 'pointercancel', 390, 112)
  const partial = screen.getByTestId('bath-scene').parentElement.textContent
  tick()
  expect(screen.getByTestId('bath-scene').parentElement.textContent).toBe(partial)
  pointer(shower, 'pointerdown', 530, 112); tick()
  pointer(shower, 'pointermove', 600, 112); tick()
  expect(completeBath).toHaveBeenCalledTimes(1)
  expect(shower).toBeDisabled()
  tick(5000)
  expect(completeBath).toHaveBeenCalledTimes(1)
})
it('opens from the room and saves cleanliness only after finishing a bath', () => {
  localStorage.setItem(CARE_KEY, JSON.stringify({ version: 2, stats: { ...DEFAULT_CARE, cleanliness: 30 }, updatedAt: Date.now() }))
  render(<JummoRoom />)
  fireEvent.click(screen.getByRole('button', { name: 'Bath', exact: true }))
  const shower = prepare()
  soapAll()
  pointer(shower, 'pointerdown', 390, 112); tick()
  pointer(shower, 'pointermove', 530, 112); tick()
  pointer(shower, 'pointermove', 600, 112); tick()
  expect(readCare().cleanliness).toBeCloseTo(70, 0)
  fireEvent.click(screen.getByRole('button', { name: 'Back to room' }))
  expect(screen.getByRole('button', { name: 'Bath', exact: true })).toBeInTheDocument()
})
it('supports keyboard rinsing and turns water off when focus leaves', () => {
  render(<BathRoom stats={DEFAULT_CARE} completeBath={vi.fn()} onBack={() => {}} />)
  const shower = prepare()
  fireEvent.keyDown(shower, { key: 'Enter' })
  expect(shower).toHaveAttribute('aria-pressed', 'true')
  fireEvent.keyDown(shower, { key: 'ArrowLeft' })
  expect(shower.parentElement.style.left).toBe('74%')
  fireEvent.blur(shower)
  expect(shower).toHaveAttribute('aria-pressed', 'false')
})
it('creates foam locally and cannot complete a bath by rinsing only one soaped area', () => {
  const completeBath = vi.fn()
  const { container } = render(<BathRoom stats={DEFAULT_CARE} completeBath={completeBath} onBack={() => {}} />)
  const shower = prepare()
  const soap = screen.getByRole('button', { name: 'Soap bottle' })
  soap.setPointerCapture = vi.fn()
  pointer(soap, 'pointerdown', 100, 100)
  expect(container.querySelectorAll('.jr-bath-foam')).toHaveLength(0)
  pointer(soap, 'pointermove', 390, 220)
  const foam = [...container.querySelectorAll('.jr-bath-foam')]
  expect(foam.some((patch) => Number(patch.style.opacity) > 0)).toBe(true)
  expect(foam.some((patch) => Number(patch.style.opacity) === 0)).toBe(true)
  pointer(soap, 'pointerup', 390, 220)
  pointer(shower, 'pointerdown', 390, 112); tick(4000)
  expect(completeBath).not.toHaveBeenCalled()
})
