import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import StarSkyBackground from './StarSkyBackground'

it('renders the three animated decorative layers above no pointer target', () => {
  render(<StarSkyBackground />)
  const background = document.querySelector('.star-sky-background')
  expect(background).toHaveClass('star-sky-background')
  expect(background.querySelectorAll('.stars, .stars2, .stars3')).toHaveLength(3)
  expect(background.getAttribute('aria-hidden')).toBe('true')
  expect(background.querySelector('.stars').className).toBe('stars')
})
