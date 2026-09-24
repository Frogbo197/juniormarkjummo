import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import MediaHub from './MediaHub'
afterEach(() => { location.hash = '' })
it('filters by a linked editorial era without assigning a capture date', async () => {
  location.hash = '/media?era=fancon'
  const user = userEvent.setup()
  const openPhoto = vi.fn()
  render(<MediaHub openPhoto={openPhoto} />)
  expect(screen.getByText('1 kết quả')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Xem ảnh Our Little Sunshine' }))
  expect(openPhoto.mock.calls[0][0]).toMatchObject({ memoryId: 'fancon', era: 'fancon', credit: 'BRACIB • Ảnh do người dùng cung cấp.' })
  expect(screen.getByText(/Undated archive/)).toBeInTheDocument()
})
