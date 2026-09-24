import { expect, it } from 'vitest'
import { layoutStars, safeMessageDate } from './starLayout'
it('gives 100 messages distinct stable slots independent of input ordering', () => {
  const messages = Array.from({ length: 100 }, (_, index) => ({ id: `star-${index}` }))
  const first = layoutStars(messages)
  expect(new Set(Object.values(first).map((point) => `${point.x},${point.y}`)).size).toBe(100)
  expect(layoutStars([...messages].reverse())).toEqual(first)
  const next = layoutStars([{ id: 'new-star' }, ...messages], first)
  for (const message of messages) expect(next[message.id]).toEqual(first[message.id])
  expect(layoutStars(messages.slice(0, 5), first)).toMatchObject(first)
})
it('does not render invalid dates', () => {
  expect(safeMessageDate('invalid')).toBe('Date unavailable')
  expect(safeMessageDate(null)).toBe('Date unavailable')
  expect(safeMessageDate('2026-09-18T00:00:00Z')).toBe('2026-09-18')
})
