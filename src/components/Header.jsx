import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CalendarDays, Camera, Compass, FileText, Menu, UserRound, Users, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import './Header.css'
import { findMemory } from '../data/memories'
import { readJourney } from '../lib/journey'

const groups = [
  { name: 'Archive', links: [
    ['Profiles', 'profiles', 'Meet Junior & Mark', Users],
    ['Timeline / Constellation', 'timeline', 'Follow the connected memories', Compass],
    ['Visual Archive', 'media', 'Search credited photos', Camera],
  ] },
  { name: 'Orbit', links: [['Schedule', 'schedule', 'Verified and sample dates', CalendarDays], ['Birthdays', 'studio?section=profiles', 'Return to the birthday cards', CalendarDays]] },
  { name: 'Community', links: [['Starry Sky', 'sky', 'Leave a moderated star', Compass], ['Wall', 'wall', 'Read fan notes', FileText], ['Fan Hub', 'projects', 'Guides and fan projects', Users]] },
]

export default function Header({ auth, openAuth, route = 'studio' }) {
  const [expanded, setExpanded] = useState(false)
  const [group, setGroup] = useState(null)
  const [hoverGroup, setHoverGroup] = useState(null)
  const [mobile, setMobile] = useState(() => window.matchMedia?.('(max-width: 899px)').matches || false)
  const menuButton = useRef(null)
  const triggers = useRef({})
  const header = useRef(null)
  const openTimer = useRef(null)
  const lastMemory = findMemory(readJourney().lastMemory)
  const root = route.split('/')[0]
  useEffect(() => {
    const query = window.matchMedia?.('(max-width: 899px)')
    if (!query) return
    const update = () => { setMobile(query.matches); close() }
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    const closeOutside = (event) => { if (!header.current?.contains(event.target)) close() }
    document.addEventListener('pointerdown', closeOutside)
    return () => { document.removeEventListener('pointerdown', closeOutside); clearTimeout(openTimer.current) }
  })
  function close() { clearTimeout(openTimer.current); setExpanded(false); setGroup(null); setHoverGroup(null) }
  function openOnIntent(name) {
    if (mobile) return
    clearTimeout(openTimer.current)
    openTimer.current = setTimeout(() => setHoverGroup(name), 150)
  }
  function closeOnLeave() {
    if (mobile) return
    clearTimeout(openTimer.current)
    openTimer.current = setTimeout(() => setHoverGroup(null), 180)
  }
  function escape(event) {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    if (mobile && expanded) { close(); menuButton.current?.focus() }
    else if (group) { triggers.current[group]?.focus(); setGroup(null) }
    else { setExpanded(false); menuButton.current?.focus() }
  }
  return (
    <header className="header-wrap archive-header" ref={header} onKeyDown={escape}>
      <div className="site-header glass-strong">
        <a className="brand" href="#/studio" aria-label="JuniorMark — Trang chủ" onClick={close}>
          <span className="brand-logo"><img src="/images/juniormark-logo.png" width="36" height="36" alt="" /></span>
          <span><strong>JuniorMark</strong><small>Celestial Archive</small></span>
        </a>
        <nav className={expanded ? 'main-nav expanded' : 'main-nav'} id="main-nav" aria-label="Điều hướng chính" aria-hidden={mobile && !expanded ? true : undefined} inert={mobile && !expanded}>
          <a href="#/studio" aria-current={root === 'studio' ? 'page' : undefined} onClick={close}>Studio</a>
          {groups.map(({ name, links }) => {
            const open = group === name || hoverGroup === name
            return <div className="nav-group" key={name} onMouseEnter={() => openOnIntent(name)} onMouseLeave={closeOnLeave} onFocus={() => openOnIntent(name)} onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) closeOnLeave()
            }}>
              <button ref={(node) => { triggers.current[name] = node }} className={links.some(([, path]) => path === root) ? 'active-area' : ''}
                aria-expanded={open} aria-controls={`nav-${name}`} onClick={() => { clearTimeout(openTimer.current); setGroup(group === name ? null : name); setHoverGroup(null) }}>{name}</button>
              <div className={`nav-group-links${open ? ' is-open' : ''}`} id={`nav-${name}`} aria-hidden={!open} inert={!open}>
                {links.map(([label, path, description, Icon]) => <a key={path} href={`#/${path}`} aria-label={label} aria-current={root === path ? 'page' : undefined} onClick={close}>
                  <Icon size={17} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span><ArrowUpRight size={15} aria-hidden="true" />
                </a>)}
                {name === 'Archive' && lastMemory && <a className="last-memory-link" href={`#/timeline?era=${lastMemory.era}&memory=${lastMemory.id}`} onClick={close}><FileText size={17} aria-hidden="true" /><span><strong>Last explored: {lastMemory.title}</strong><small>Continue your journey</small></span><ArrowUpRight size={15} aria-hidden="true" /></a>}
              </div>
            </div>
          })}
        </nav>
        <div className="header-utilities">
          <a className="jummo-cta" href="#/jummo" aria-current={root === 'jummo' ? 'page' : undefined} onClick={close}><img src="/images/jummo-mascot.png" alt="" width="30" height="30" /> <span>Jummo</span></a>
          <a className="account-button" aria-label="My Orbit / account" href="#/orbit" onClick={close}>
            <UserRound size={16} /><span>My Orbit</span>
          </a>
          {!auth.session && <button className="header-signin" onClick={() => openAuth('signin')} disabled={auth.loading}>Đăng nhập</button>}
          <ThemeToggle compact />
        </div>
        <button ref={menuButton} className="icon-button menu-button" aria-label={expanded ? 'Đóng menu' : 'Mở menu'} aria-expanded={expanded} aria-controls="main-nav" onClick={(event) => {
          clearTimeout(openTimer.current); setExpanded(!expanded); setGroup(null); setHoverGroup(null)
          if (mobile && !expanded && event.detail === 0) requestAnimationFrame(() => header.current?.querySelector('.main-nav > a')?.focus())
        }}>
          {expanded ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  )
}
