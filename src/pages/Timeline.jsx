import { useEffect, useRef, useState } from 'react'
import { memories, findMemory } from '../data/memories'
import { readJourney, rememberMemory } from '../lib/journey'
import { PageIntro, SectionTitle, Tip } from './shared'
import SaveToOrbit from '../components/SaveToOrbit'
import ShareCardButton from '../components/ShareCardButton'
import { useOrbit } from '../features/orbit/orbitContext'

function selectedMemory() {
  const query = new URLSearchParams(location.hash.split('?')[1])
  return findMemory(query.get('memory')) || findMemory(query.get('era')) || findMemory(readJourney().lastMemory) || memories[0]
}
export default function Timeline({ openPhoto }) {
  const orbit = useOrbit()
  const [id, setId] = useState(() => selectedMemory().id)
  const [preview, setPreview] = useState(null)
  const stars = useRef([])
  const memory = findMemory(id) || memories[0]
  useEffect(() => {
    const sync = () => setId(selectedMemory().id)
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  useEffect(() => { rememberMemory(id) }, [id])
  useEffect(() => {
    if (orbit && !orbit.loading && !orbit.busy && !orbit.error && !orbit.has('progress', id)) void orbit.save('progress', id)
  }, [id, orbit])
  function select(item) {
    setId(item.id)
    window.location.assign(`#/timeline?era=${item.era}&memory=${item.id}`)
  }
  function navigate(event, index) {
    const next = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: memories.length - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    stars.current[(next + memories.length) % memories.length]?.focus()
  }
  return <>
    <PageIntro eyebrow="Starlight chronology" title="Constellation of Memories" description="Bản đồ các vì tinh tú đánh dấu từng chương trong hành trình Junior & Mark.">
      <Tip>Tab or arrow keys to explore stars. Enter to open a memory. These are editorial collections, not a verified release calendar.</Tip>
    </PageIntro>
    <section className="memory-constellation" aria-label="Memory star journey">
      <svg className="constellation-lines" viewBox="0 0 1000 280" preserveAspectRatio="none" aria-hidden="true"><path d="M125 160 L375 80 L625 180 L875 100" /></svg>
      <ol className="constellation-path">
        {memories.map((item, index) => <li key={item.id} style={{ '--star-offset': `${[80, 0, 100, 20][index]}px` }}>
          <button ref={(node) => { stars.current[index] = node }} aria-label={`Explore ${item.title}`} aria-pressed={id === item.id} aria-controls="memory-detail"
            onKeyDown={(event) => navigate(event, index)} onClick={() => select(item)} onFocus={() => setPreview(item.id)} onBlur={() => setPreview(null)} onMouseEnter={() => setPreview(item.id)} onMouseLeave={() => setPreview(null)}>
            <span className="memory-star" aria-hidden="true">✦</span><span className="eyebrow">{item.label}</span><strong>{item.title}</strong><small>{item.roles}</small>
          </button>
          <p className="star-preview" hidden={preview !== item.id}>{item.summary}</p>
        </li>)}
      </ol>
    </section>
    <section id="memory-detail" className="memory-detail glass-medium" aria-label="Selected memory" aria-live="polite">
      <div>
        <span className="eyebrow">{memory.year} · Editorial collection · Unverified dates</span>
        <h2>{memory.title}</h2><p>{memory.summary}</p><p>{memory.roles}</p>
        <SaveToOrbit kind="memory" id={memory.id} />
        <ShareCardButton card={{ title: memory.title, subtitle: 'Memory share card · Editorial collection', lines: [memory.roles, memory.summary, 'Dates unverified · Explore the original photos and credits in the Archive.'] }} filename={`memory-${memory.id}`} />
        <p className="muted">Ảnh thuộc bộ sưu tập người dùng cung cấp, không khẳng định được chụp tại sự kiện này.</p>
        <div className="toolbar"><a className="primary-button" href={`#/media?era=${memory.era}`}>Related Visual Archive ↗</a>{memory.people.map((person) => <a key={person} className="text-button" href={`#/profiles/${person}`}>{person === 'junior' ? 'Junior' : 'Mark'} profile ↗</a>)}</div>
        <h3>Playlist gắn liền cột mốc</h3><p>Bản thu trong thiết kế chưa được cung cấp.</p>
        <a className="text-button" href="https://www.youtube.com/@gmmtv" target="_blank" rel="noreferrer">Ghé kênh GMMTV ↗</a>
      </div>
      <figure><button className="memory-photo" onClick={() => openPhoto(memory.images[0])} aria-label={`Open photo for ${memory.title}`}><img src={memory.images[0].src} alt={memory.images[0].alt} /></button><figcaption>{memory.images[0].credit}</figcaption></figure>
    </section>
    <SectionTitle eyebrow="Original photos · preserved credits">Fandom Stellar Gallery</SectionTitle>
    <div className="three-columns">{memories.slice(0, 3).map((item) => <button className="image-story" key={item.id} onClick={() => openPhoto(item.images[0])}><img src={item.images[0].src} alt={item.images[0].alt} loading="lazy" /><div><h3>{item.title}</h3><p>{item.roles}</p></div></button>)}</div>
  </>
}
