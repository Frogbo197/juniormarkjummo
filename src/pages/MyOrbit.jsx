import { useEffect, useState } from 'react'
import { useOrbit } from '../features/orbit/orbitContext'
import { useAuth } from '../features/auth/authContext'
import { supabase } from '../lib/supabase'
import { findMemory, memories } from '../data/memories'
import { readJourney } from '../lib/journey'
import { orbitBadges } from '../lib/orbit'
import { PageIntro, SectionTitle } from './shared'
import SaveToOrbit from '../components/SaveToOrbit'
import ShareCardButton from '../components/ShareCardButton'

export default function MyOrbit({ openAuth, openAccount }) {
  const orbit = useOrbit(), auth = useAuth()
  const [messages, setMessages] = useState([]), [messageError, setMessageError] = useState('')
  useEffect(() => {
    let active = true
    if (!orbit.userId || !supabase) return
    supabase.rpc('my_archive_messages').then(({ data, error }) => {
      if (active) { setMessages(data || []); setMessageError(error ? 'Private messages unavailable. Migration 003 and owner access are required.' : '') }
    }).catch(() => { if (active) setMessageError('Private messages could not load. Try again later.') })
    return () => { active = false }
  }, [orbit.userId])
  const visits = orbit.userId ? orbit.items.filter((item) => item.kind === 'progress' && findMemory(item.item_id)).map((item) => item.item_id) : readJourney().visited
  const badges = orbitBadges([...orbit.items, ...visits.map((id) => ({ kind: 'progress', item_id: id }))])
  return <>
    <PageIntro eyebrow="Your personal archive" title="My Orbit" description="Saved memories, dates and the chapters you have explored.">
      <button className="secondary-button" onClick={auth.session ? openAccount : () => openAuth('signin')}>{auth.session ? 'Account settings' : 'Sign in'}</button>
    </PageIntro>
    <p className="notice">{orbit.userId ? 'Private account collection · Supabase owner access. Guest collections stay separate on this browser.' : 'Guest collection · saved on this browser only. Signing in opens your separate private collection.'}</p>
    {orbit.loading && <p role="status">Loading My Orbit…</p>}
    {orbit.error && <p className="error-message" role="alert">{orbit.error}</p>}
    <SectionTitle eyebrow="Collect">Saved Memories</SectionTitle>
    <div className="orbit-list">{orbit.items.filter((item) => item.kind === 'memory').map((item) => <article key={item.item_id}><h3><a href={`#/timeline?memory=${item.item_id}`}>{findMemory(item.item_id)?.title || 'Archived memory'}</a></h3><SaveToOrbit kind="memory" id={item.item_id} payload={item.payload} /></article>)}</div>
    {!orbit.items.some((item) => item.kind === 'memory') && <p>No saved memories yet. <a className="text-button" href="#/timeline">Explore the Constellation ↗</a></p>}
    <SectionTitle eyebrow="Return">Saved Events</SectionTitle>
    <div className="orbit-list">{orbit.items.filter((item) => item.kind === 'event').map((item) => <article key={item.item_id}><h3>{typeof item.payload.title === 'string' ? item.payload.title : 'Saved date'}</h3><p>{typeof item.payload.date === 'string' ? item.payload.date : ''} · {item.payload.demo ? 'DEMO / SAMPLE' : 'UNCONFIRMED · Archive birthday reminder'}</p><a href="#/schedule">Open Schedule ↗</a><SaveToOrbit kind="event" id={item.item_id} payload={item.payload} /></article>)}</div>
    {!orbit.items.some((item) => item.kind === 'event') && <p>No saved dates yet. <a className="text-button" href="#/schedule">Explore Orbit dates ↗</a></p>}
    <SectionTitle eyebrow="Participate">My Star / messages</SectionTitle>
    {orbit.userId ? <>{messageError && <p role="status">{messageError}</p>}{messages.map((message) => <article className="orbit-message" key={message.id}><h3>{message.name}</h3><p>{message.body}</p><small>{message.status} · {message.spectrum}</small></article>)}{!messages.length && !messageError && <p>No submitted messages found.</p>}</> : <p>Guest messages are local previews in <a className="text-button" href="#/sky">Starry Sky</a>. Sign in to submit a message for moderation.</p>}
    <SectionTitle eyebrow="Explore">Journey Progress</SectionTitle>
    <p>{visits.length}/{memories.length} editorial memories explored.</p>
    <progress aria-label="Journey progress" max={memories.length} value={visits.length} />
    <ul>{memories.map((memory) => <li key={memory.id}><a href={`#/timeline?era=${memory.era}`}>{visits.includes(memory.id) ? '✦' : '✧'} {memory.title}</a></li>)}</ul>
    <SectionTitle eyebrow="Fansite keepsakes · no rankings">Your badges</SectionTitle>
    <p>{badges.length ? badges.join(' · ') : 'Explore a memory to begin your collection.'}</p>
    <p className="muted">First Star: submit a star. Jummo Friend: visit Jummo. Archive Explorer: explore a memory. Era Explorer: explore all {memories.length} eras.</p>
    <ShareCardButton filename="my-orbit" card={{ title: 'My Orbit', subtitle: orbit.userId ? 'My private archive · Summary' : 'My browser collection · Summary', lines: [`${orbit.items.filter((item) => item.kind === 'memory').length} saved memories`, `${orbit.items.filter((item) => item.kind === 'event').length} saved dates`, `${visits.length}/${memories.length} memories explored`, badges.length ? badges.join(' · ') : 'A journey just beginning'] }} />
    <SectionTitle eyebrow="Community">Saved favorites</SectionTitle>
    {orbit.items.filter((item) => item.kind === 'favorite').map((item) => <article className="orbit-message" key={item.item_id}><a href={item.payload.kind === 'note' ? '#/wall' : '#/sky'}>{typeof item.payload.name === 'string' ? item.payload.name : 'Community message'} ↗</a><SaveToOrbit kind="favorite" id={item.item_id} payload={item.payload} /></article>)}
  </>
}

