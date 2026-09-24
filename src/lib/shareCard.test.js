import { expect, it } from 'vitest'
import { cardText, wrapCardText } from './shareCard'
it('includes a fansite disclaimer and only explicitly provided personal content', () => {
  const text = cardText({ title: 'My Orbit', lines: ['2 saved memories'], user_id: 'private-uuid' })
  expect(text).toContain('Unofficial fansite')
  expect(text).toContain('2 saved memories')
  expect(text).not.toContain('private-uuid')
})
it('wraps long words and limits overflowing lines', () => {
  const lines = wrapCardText('abcdefghijk lmnop qrstuv', 5, (text) => text.length, 3)
  expect(lines).toHaveLength(3)
  expect(lines.every((line) => line.length <= 5)).toBe(true)
  expect(lines[2]).toMatch(/…$/)
})
