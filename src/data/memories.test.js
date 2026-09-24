import { expect, it } from 'vitest'
import { memories, findMemory, memoriesForPerson, memoryForPhoto } from './memories'
import { eras } from '../pages/journeyData'
import { photos } from '../lib/photos'

it('derives every era from a memory without inventing exact dates or verification', () => {
  expect(memories).toHaveLength(4)
  expect(eras.map((era) => era.id)).toEqual(memories.map((memory) => memory.era))
  expect(memories.every((memory) => memory.date === null && memory.verified === false)).toBe(true)
  expect(findMemory('cherry').title).toBe('Cherry Magic')
  expect(findMemory('missing')).toBeUndefined()
})
it('links people and illustrative photos while retaining original credits', () => {
  expect(memoriesForPerson('junior')).toHaveLength(4)
  expect(memoriesForPerson('missing')).toHaveLength(0)
  const photo = photos.find((item) => item.file === 'HPWCyKybkAAHKUm.jpg')
  const memory = memoryForPhoto(photo.file)
  expect(memory.era).toBe('fancon')
  expect(memory.images[0].credit).toBe(photo.credit)
  expect(memory.images[0].src).toBe(photo.src)
})
