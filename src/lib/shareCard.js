const disclaimer = 'Unofficial fansite keepsake · Not official certification'
export function cardText({ title = '', subtitle = '', lines = [] }) {
  return ['JuniorMark Celestial Archive', title, subtitle, ...lines, disclaimer].filter(Boolean).join('\n')
}
export function wrapCardText(text, maxWidth, measure, maxLines = 8) {
  const lines = []; let line = ''
  for (const character of String(text)) {
    if (character === '\n' || (line && measure(line + character) > maxWidth)) { lines.push(line.trim()); line = '' }
    if (character !== '\n') line += character
  }
  if (line) lines.push(line.trim())
  if (lines.length > maxLines) {
    lines.length = maxLines
    let last = lines[maxLines - 1]
    while (last && measure(last + '…') > maxWidth) last = last.slice(0, -1)
    lines[maxLines - 1] = last + '…'
  }
  return lines
}
export async function exportCardPng(card, filename = 'juniormark-card') {
  const canvas = document.createElement('canvas')
  canvas.width = 1200; canvas.height = 1500
  const context = canvas.getContext('2d')
  if (!context) throw new Error('PNG export is unavailable in this browser.')
  const gradient = context.createLinearGradient(0, 0, 1200, 1500)
  gradient.addColorStop(0, '#101726'); gradient.addColorStop(1, '#292338')
  context.fillStyle = gradient; context.fillRect(0, 0, 1200, 1500)
  context.strokeStyle = '#aa8650'; context.lineWidth = 2; context.strokeRect(42, 42, 1116, 1416)
  for (let index = 0; index < 55; index++) {
    context.fillStyle = index % 3 ? '#a7c8ff' : '#ffdba0'
    context.beginPath(); context.arc(70 + (index * 193) % 1060, 70 + (index * 317) % 1360, index % 3 + 1, 0, Math.PI * 2); context.fill()
  }
  context.fillStyle = '#101726ee'; context.fillRect(84, 180, 1032, 1120)
  context.fillStyle = '#ffdba0'; context.font = '28px sans-serif'; context.fillText('JuniorMark · Celestial Archive', 110, 140)
  context.font = '64px Georgia, serif'
  let y = 290
  for (const line of wrapCardText(card.title, 960, (text) => context.measureText(text).width, 3)) { context.fillText(line, 110, y); y += 82 }
  context.fillStyle = '#a7c8ff'; context.font = '30px sans-serif'
  for (const line of wrapCardText(card.subtitle || '', 960, (text) => context.measureText(text).width, 2)) { context.fillText(line, 110, y + 25); y += 45 }
  y += 70; context.fillStyle = '#f0e4d2'; context.font = '34px sans-serif'
  for (const line of wrapCardText((card.lines || []).join('\n\n'), 960, (text) => context.measureText(text).width, Math.max(1, Math.floor((1230 - y) / 48)))) { context.fillText(line, 110, y); y += 48 }
  context.fillStyle = '#ffdba0'; context.font = '24px sans-serif'; context.fillText(disclaimer, 110, 1380)
  const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'))
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a'); link.href = url; link.download = `${filename.replace(/[^a-z0-9_-]/gi, '-')}.png`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
