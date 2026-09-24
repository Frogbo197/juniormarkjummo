import { useEffect, useState } from 'react'
import { memories, findMemory } from '../data/memories'
import { readJourney, nearestBirthday } from '../lib/journey'
import { useOrbit } from '../features/orbit/orbitContext'
import { Tip } from '../pages/shared'
let sessionDismissed = false
export default function JummoCompanion({ route }) {
  const orbit = useOrbit()
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('jm-companion-dismissed') === 'yes' } catch { return sessionDismissed }
  })
  useEffect(() => {
    if (route === 'jummo' && orbit && !orbit.loading && !orbit.busy && !orbit.error && !orbit.has('progress', 'jummo')) void orbit.save('progress', 'jummo')
  }, [route, orbit])
  if (dismissed) return null
  const knownRoutes = ['studio', 'profiles', 'timeline', 'media', 'schedule', 'sky', 'wall', 'jummo', 'orbit', 'account', 'projects']
  const missing = !knownRoutes.includes(route)
  const query = new URLSearchParams(window.location.hash.split('?')[1])
  const current = findMemory(query.get('memory')) || findMemory(query.get('era')) || findMemory(readJourney().lastMemory)
  const next = memories[(memories.findIndex((memory) => memory.id === current?.id) + 1) % memories.length]
  let title = 'Jummo’s little guide', message = 'One star can open a whole chapter.', links = [['Explore the Archive', '#/timeline']]
  let mode = 'companion-home', image = '/main_mas.png'
  if (route === 'studio') { title = 'First time here?'; message = 'Meet the duo, explore a memory, or leave a star when you are ready.'; links = [['Meet Junior & Mark', '#/profiles'], ['Explore the Archive', '#/timeline'], ['Leave a star', '#/sky']] }
  else if (route === 'timeline') { mode = 'companion-timeline'; message = `Active chapter: ${current?.title || 'Cherry Magic'}. Jummo suggests the next star: ${next.title}.`; links = [['Follow the next star', `#/timeline?era=${next.era}`]] }
  else if (route === 'media') { mode = 'companion-media'; image = '/camera_ms.png'; message = 'Original credits stay with every photo. Capture dates are left undated when unverified.'; links = [['Open the related memory', `#/timeline?era=${current?.era || 'cherry'}`]] }
  else if (route === 'schedule') { mode = 'companion-schedule'; image = '/calender_ms.png'; message = `Nearest archive birthday: ${nearestBirthday().name}. No verified upcoming event is listed.`; links = [['Explore their profile', `#/profiles/${nearestBirthday().name.startsWith('Junior') ? 'junior' : 'mark'}`]] }
  else if (['sky', 'wall', 'projects'].includes(route)) { mode = 'companion-community'; message = 'Leave a kind star at your own pace. New public messages are moderated.'; links = [['Visit Starry Sky', '#/sky']] }
  else if (route === 'jummo') { message = 'Bring a little Jummo sunshine into your journey.'; links = [['Explore Jummo’s memory', '#/timeline?era=fancon']] }
  else if (route === 'orbit' || route === 'account') { mode = 'companion-orbit'; message = 'Your collection grows through real visits and saves.'; links = [['Continue your journey', `#/timeline?era=${current?.era || 'cherry'}`]] }
  else if (missing) { mode = 'companion-missing'; image = '/sleep_mc.png'; title = 'Jummo fell asleep here'; message = 'This archive path is not in the map yet.'; links = [['Back to Studio', '#/studio'], ['Open Archive', '#/timeline']] }
  return <aside className={`jummo-companion ${mode} glass-medium`} aria-label="Jummo companion">
    <Tip title={title} image={image} className="companion-tip">{message}</Tip>
    <div className="companion-links">{links.map(([label, href]) => <a className="text-button" href={href} key={href}>{label} ↗</a>)}</div>
    <button className="icon-button" aria-label="Dismiss Jummo guide" onClick={() => { sessionDismissed = true; setDismissed(true); try { sessionStorage.setItem('jm-companion-dismissed', 'yes') } catch { /* in-memory session fallback */ } }}>×</button>
  </aside>
}
