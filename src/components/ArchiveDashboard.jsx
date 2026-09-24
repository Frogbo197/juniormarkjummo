import { memories, findMemory } from '../data/memories'
import { photos } from '../lib/photos'
import { dailyMemory, nearestBirthday, readJourney } from '../lib/journey'

export default function ArchiveDashboard() {
  const daily = dailyMemory(), birthday = nearestBirthday(), journey = readJourney()
  const last = findMemory(journey.lastMemory)
  return <section className="archive-dashboard" aria-label="Now in the Archive">
    <div className="dashboard-now glass-soft">
      <span className="eyebrow">Welcome to your living fandom universe</span>
      <h2>Now in the Archive</h2>
      <p>{memories.length} editorial memories · {photos.length} credited photos</p>
      <p>Next birthday: <strong>{birthday.name}</strong> · {birthday.day}/{birthday.month}/{birthday.year}{birthday.today ? ' · Today!' : ''}</p>
      <a className="text-button" href="#/schedule">Explore Orbit dates ↗</a>
    </div>
    <article className="dashboard-memory glass-medium">
      <span className="eyebrow">Memory of the Day · curated rotation, UTC+7</span>
      <h2>{daily.title}</h2><p>{daily.summary}</p>
      <a className="primary-button" href={`#/timeline?memory=${daily.id}&era=${daily.era}`}>Explore this memory ↗</a>
    </article>
    <div className="dashboard-continue glass-soft">
      <h3>Continue Your Journey</h3>
      <p>{last ? `Last explored: ${last.title}` : 'Your first chapter is waiting.'} · {journey.visited.length}/{memories.length} memories explored on this browser.</p>
      <a className="text-button" href={`#/timeline?era=${last?.era || 'cherry'}`}>{last ? 'Return to your memory' : 'Begin with Cherry Magic'} ↗</a>
      <p>Jummo suggests: follow one star, then discover its original photo in the Visual Archive.</p>
    </div>
  </section>
}
