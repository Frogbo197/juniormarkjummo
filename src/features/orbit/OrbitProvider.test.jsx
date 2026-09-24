import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { AuthContext } from '../auth/authContext'
import OrbitProvider from './OrbitProvider'
import SaveToOrbit from '../../components/SaveToOrbit'

it('persists a guest save across mounts and removes it explicitly', async () => {
  localStorage.clear()
  const user = userEvent.setup()
  const tree = <AuthContext.Provider value={{ loading: false, session: null }}><OrbitProvider><SaveToOrbit kind="memory" id="cherry" /></OrbitProvider></AuthContext.Provider>
  const view = render(tree)
  await user.click(screen.getByRole('button', { name: 'Save to My Orbit' }))
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  view.unmount()
  render(tree)
  await user.click(screen.getByRole('button', { name: 'Saved · Remove from My Orbit' }))
  expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  expect(JSON.parse(localStorage.getItem('jm-orbit-guest'))).toEqual([])
})
