import { CARE_CONFIG } from './careConfig'
const root = '/images/jummo-room/dining/'
export const DINING = {
  art: { idle: `${root}kitchen.png`, mouth: `${root}open mouth.png`, eating: `${root}eat.gif` },
  // All three assets contain the same character and scene: no extra sprite layer.
  character: { x: .31, y: .28, width: .37, height: .36, bakedIntoScene: true },
  mouth: { x: .445, y: .505, width: .10, height: .085 },
  dragSize: 72,
  mealDuration: 2400,
  debugMouth: false,
  table: { y: .775, desktopX: [.22, .36, .50, .64, .78], mobileX: [.28, .50, .72], breakpoint: 600 },
}
// Transparent sprites derived from supplied food art; original files are retained.
export const FOODS = [
  { id: 'apple', vi: 'Táo', en: 'Apple' },
  { id: 'bao', vi: 'Bánh bao', en: 'Bao bun' },
  { id: 'fish', vi: 'Cá', en: 'Fish' },
  { id: 'rice', vi: 'Cơm nắm', en: 'Rice ball' },
  { id: 'egg', vi: 'Trứng', en: 'Egg' },
].map((food) => ({ ...food, src: `${root}${food.id}-transparent.png`, nutrition: CARE_CONFIG.defaultNutrition }))
export function isAtMouth(x, y, rect) {
  if (!rect?.width || !rect.height) return false
  const nx = (x - rect.left) / rect.width, ny = (y - rect.top) / rect.height
  const mouth = DINING.mouth
  return nx >= mouth.x && nx <= mouth.x + mouth.width && ny >= mouth.y && ny <= mouth.y + mouth.height
}

