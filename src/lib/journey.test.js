import { expect, it } from 'vitest'
import { dailyMemory, readJourney, rememberMemory, nearestBirthday } from './journey'
it('selects a stable daily memory and rolls the day in Bangkok', () => {
  expect(dailyMemory(new Date('2026-09-18T03:00:00Z'))).toEqual(dailyMemory(new Date('2026-09-18T16:59:00Z')))
  expect(dailyMemory(new Date('2026-09-18T17:00:00Z'))).not.toEqual(dailyMemory(new Date('2026-09-18T16:59:00Z')))
  expect(nearestBirthday(new Date('2026-09-18T00:00:00Z')).name).toBe('Junior Panachai')
})
it('retains real visits and tolerates blocked or malformed storage', () => {
  localStorage.clear()
  rememberMemory('cherry')
  rememberMemory('cherry')
  expect(readJourney()).toEqual({ lastMemory: 'cherry', visited: ['cherry'] })
  const blocked = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') } }
  expect(readJourney(blocked).visited).toEqual([])
  expect(() => rememberMemory('liners', blocked)).not.toThrow()
})
