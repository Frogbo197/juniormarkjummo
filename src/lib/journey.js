import { memories, findMemory } from '../data/memories'
import { birthdayCountdown } from './helpers'
const key = 'jm-archive-journey'
export function dailyMemory(now = new Date()) {
  const day = Math.floor((now.getTime() + 7 * 3600000) / 86400000)
  return memories[((day % memories.length) + memories.length) % memories.length]
}
export function readJourney(storage) {
  try {
    const value = JSON.parse((storage || localStorage).getItem(key) || '{}')
    return { lastMemory: findMemory(value.lastMemory)?.id || null, visited: [...new Set((Array.isArray(value.visited) ? value.visited : []).filter((id) => findMemory(id)))] }
  } catch { return { lastMemory: null, visited: [] } }
}
export function rememberMemory(id, storage) {
  if (!findMemory(id)) return
  try {
    const previous = readJourney(storage)
    ;(storage || localStorage).setItem(key, JSON.stringify({ lastMemory: id, visited: [...new Set([...previous.visited, id])] }))
    window.dispatchEvent(new Event('archive-journey'))
  } catch { /* Browsing remains available without persistent storage. */ }
}
export function nearestBirthday(now = new Date()) {
  return [{ name: 'Junior Panachai', month: 10, day: 23 }, { name: 'Mark Jiruntanin', month: 6, day: 15 }]
    .map((person) => ({ ...person, ...birthdayCountdown(person.month, person.day, now) }))
    .sort((a, b) => (Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day)))[0]
}
