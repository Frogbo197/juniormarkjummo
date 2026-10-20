// Percentages of the original 1678 × 937 image: keep the scene aspect ratio.
export const ROOM_ART = '/images/jummo-room/bedroom.png'
export const JUMMO_ART = '/images/jummo-room/jummo.png'
export const ACTIVITY_ART = {
  reading: '/images/jummo-room/reading.gif',
  dancing: '/images/jummo-room/dancing.gif',
  sleeping: '/images/jummo-room/sleeping.gif',
  stargazing: '/images/jummo-room/stargazing.gif',
}
export const ROOM_ASPECT = 1678 / 937
export const HOME = { x: 46, y: 83 }
export const BED_PATH = [{ x: 37, y: 82 }, { x: 30, y: 77 }, { x: 26, y: 65 }]
export const HOTSPOTS = {
  bed: { left: '10%', top: '45%', width: '32%', height: '34%' },
  window: { left: '74%', top: '20%', width: '20%', height: '38%' },
  radio: { left: '49%', top: '35%', width: '8%', height: '11%' },
  bookshelf: { left: '41%', top: '23%', width: '13%', height: '12%' },
}
// Visible pixels in the original 435 × 435 PNG; crop only in the renderer.
export const SPRITE_CROP = { x: 125, y: 88, width: 204, height: 235 }
export const SPRITE_WIDTH = 9
export function travelDuration(from, to) {
  return Math.max(350, Math.round(Math.hypot((to.x - from.x) * ROOM_ASPECT, to.y - from.y) * 45))
}
