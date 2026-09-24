import { expect, it } from 'vitest'
import { readGuestOrbit, writeGuestOrbit, changeOrbitItems, loadOrbit, persistOrbitItem, orbitBadges } from './orbit'
it('saves and unsaves independently and rejects malformed guest records', () => {
  localStorage.clear()
  let items = changeOrbitItems([], { kind: 'memory', item_id: 'cherry', payload: {} })
  writeGuestOrbit(items)
  expect(readGuestOrbit()).toHaveLength(1)
  items = changeOrbitItems(items, items[0], true)
  expect(items).toEqual([])
  localStorage.setItem('jm-orbit-guest', '{"wrong":true}')
  expect(readGuestOrbit()).toEqual([])
  expect(() => writeGuestOrbit([], { setItem() { throw Error('blocked') } })).toThrow(/storage/i)
})
it('surfaces server and RLS errors without pretending a save succeeded', async () => {
  const client = { from: () => ({ select: () => ({ eq: async () => ({ error: { message: 'denied' } }) }), upsert: async () => ({ error: { message: 'RLS' } }) }) }
  await expect(loadOrbit(client, 'owner')).rejects.toThrow(/Orbit/)
  await expect(persistOrbitItem(client, 'owner', { kind: 'memory', item_id: 'cherry', payload: {} })).rejects.toThrow(/Orbit/)
})
it('badges depend only on completed actions', () => {
  expect(orbitBadges([])).toEqual([])
  expect(orbitBadges([{ kind: 'progress', item_id: 'jummo' }])).toContain('Jummo Friend')
  expect(orbitBadges([{ kind: 'progress', item_id: 'star' }])).toContain('First Star')
  expect(orbitBadges([{ kind: 'progress', item_id: 'cherry' }])).toContain('Archive Explorer')
})
