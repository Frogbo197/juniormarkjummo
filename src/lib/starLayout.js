const cacheKey = 'jm-star-slots-v1'
let fallback = {}
function hash(text) { let value = 2166136261; for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619); return value >>> 0 }
// Fixed world coordinates keep older stars still; new IDs probe unoccupied cells.
export function layoutStars(messages, previous = {}) {
  const result = Object.create(null), used = new Set()
  for (const [id, point] of Object.entries(previous || {})) {
    if (point && Number.isInteger(point.slot) && point.slot >= 0 && point.slot < 10000 && !used.has(point.slot)) {
      result[id] = { slot: point.slot, x: 60 + (point.slot % 10) * 120, y: 60 + Math.floor(point.slot / 10) * 100 }
      used.add(point.slot)
    }
  }
  for (const id of [...new Set(messages.map((message) => message.id))].sort()) {
    if (result[id]) continue
    let slot = hash(id) % 100
    while (used.has(slot)) slot++
    used.add(slot)
    result[id] = { slot, x: 60 + (slot % 10) * 120, y: 60 + Math.floor(slot / 10) * 100 }
  }
  return result
}
export function readStarSlots() {
  try { const value = JSON.parse(localStorage.getItem(cacheKey) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback } catch { return fallback }
}
export function storeStarSlots(value) { fallback = value; try { localStorage.setItem(cacheKey, JSON.stringify(value)) } catch { /* stable in this session */ } }
export function safeMessageDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) return 'Date unavailable'
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp + 7 * 3600000).toISOString().slice(0, 10) : 'Date unavailable'
}
