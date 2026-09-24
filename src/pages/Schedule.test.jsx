import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import Schedule from './Schedule'
afterEach(() => vi.restoreAllMocks())
it('defaults mobile to agenda with birthday dates outside the current month', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
  render(<Schedule showInfo={vi.fn()} />)
  expect(screen.getByRole('button', { name: 'Agenda' })).toHaveAttribute('aria-pressed', 'true')
  expect(screen.getByRole('heading', { name: 'Sinh nhật Junior Panachai' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Sinh nhật Mark Jiruntanin' })).toBeInTheDocument()
  expect(screen.queryByText(/Press Conference/)).not.toBeInTheDocument()
  vi.unstubAllGlobals()
})
