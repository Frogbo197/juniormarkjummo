import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import JummoWorld from './JummoWorld'

it('shows Jummo rain when rain button is activated', async () => {
  const user = userEvent.setup()

  render(<JummoWorld showInfo={() => {}} openPhoto={() => {}} />)

  await user.click(screen.getByRole('button', { name: 'Kích hoạt Mưa Jummo' }))

  const rain = document.querySelector('.jummo-rain')
  expect(rain).toBeInTheDocument()
  expect(rain.querySelectorAll('img').length).toBeGreaterThan(0)
  expect(rain.querySelector('img')).toHaveAttribute('src', '/images/jummo_rain.png')
  const drop = rain.querySelector('img')
  expect(drop.style.animationDuration).toMatch(/^\d+(\.\d+)?s$/)
  expect(drop.style.animationDelay).toMatch(/^-?\d+(\.\d+)?s$/)
  expect(drop.style.getPropertyValue('--drop-left')).toMatch(/^\d+(\.\d+)?vw$/)
  expect(drop.style.getPropertyValue('--start-top')).toMatch(/^-?\d+(\.\d+)?vh$/)
  await user.click(screen.getByRole('button', { name: 'Dừng Mưa Jummo' }))
  expect(document.querySelector('.jummo-rain')).not.toBeInTheDocument()
})
