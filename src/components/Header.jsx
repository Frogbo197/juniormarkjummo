import { t, useLanguage, localize } from '../i18n/language'
import LanguageSelect from './LanguageSelect'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, CalendarDays, Camera, Compass, FileText, Menu, UserRound, Users, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import './Header.css'
import { findMemory } from '../data/memories'
import { readJourney } from '../lib/journey'

const groups = [
  { name: 'Archive', label: ['Kho lưu trữ', 'Archive'], links: [
    [['Hồ sơ', 'Profiles'], 'profiles', ['Gặp Junior & Mark', 'Meet Junior & Mark'], Users],
    [['Dòng thời gian tinh tú', 'Timeline / Constellation'], 'timeline', ['Theo những kỷ niệm nối liền', 'Follow the connected memories'], Compass],
    [['Thư viện hình ảnh', 'Visual Archive'], 'media', ['Tìm ảnh có ghi nguồn', 'Search credited photos'], Camera],
  ] },
  { name: 'Orbit', label: ['Lịch hẹn', 'Orbit'], links: [
    [['Lịch sự kiện', 'Schedule'], 'schedule', ['Lịch kỷ niệm và sự kiện', 'Anniversaries and events'], CalendarDays],
    [['Sinh nhật', 'Birthdays'], 'studio?section=profiles', ['Trở lại những thẻ sinh nhật', 'Return to the birthday cards'], CalendarDays],
  ] },
  { name: 'Community', label: ['Cộng đồng', 'Community'], links: [
    [['Bầu trời sao', 'Starry Sky'], 'sky', ['Gửi ngôi sao chờ duyệt', 'Leave a moderated star'], Compass],
    [['Bức tường giai điệu', 'Wall'], 'wall', ['Đọc lời nhắn của người hâm mộ', 'Read fan notes'], FileText],
    [['Góc người hâm mộ', 'Fan Hub'], 'projects', ['Hướng dẫn và dự án cộng đồng', 'Guides and fan projects'], Users],
  ] },
]

export default function Header({ auth, openAuth, route = 'studio' }) {
  useLanguage()
  const [expanded, setExpanded] = useState(false)
  const [group, setGroup] = useState(null)
  const [hoverGroup, setHoverGroup] = useState(null)
  const [scrolled, setScrolled] = useState(() => window.scrollY > 24)
  const [mobile, setMobile] = useState(() => window.matchMedia?.('(max-width: 899px)').matches || false)
  const menuButton = useRef(null)
  const triggers = useRef({})
  const header = useRef(null)
  const openTimer = useRef(null)
  const lastMemory = findMemory(readJourney().lastMemory)
  const root = route.split('/')[0]
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
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
    <>
    <header className="header-wrap"><div className="header-branding">
        <a className="brand" href="#/studio" aria-label={t('JuniorMark — Trang chủ', 'JuniorMark — Home')} onClick={close}>
          <span className="brand-logo"><img src="/images/juniormark-logo.png" width="36" height="36" alt="" /></span>
          <span><strong>JuniorMark</strong><small>{t('Kho kỷ niệm tinh tú', 'Celestial Archive')}</small></span>
        </a>
      </div></header>
    <div className={`floating-nav-wrap archive-header is-floating${scrolled ? ' is-scrolled' : ''}`} ref={header} onKeyDown={escape}>
      <div className="site-header glass-strong">
        <nav className={expanded ? 'main-nav expanded' : 'main-nav'} id="main-nav" aria-label={t('Điều hướng chính', 'Main navigation')} aria-hidden={mobile && !expanded ? true : undefined} inert={mobile && !expanded}>
          <a href="#/studio" aria-current={root === 'studio' ? 'page' : undefined} onClick={close}>{t('Phòng thu', 'Studio')}</a>
          {groups.map(({ name, label: groupLabel, links }) => {
            const open = group === name || hoverGroup === name
            return <div className="nav-group" key={name} onMouseEnter={() => openOnIntent(name)} onMouseLeave={closeOnLeave} onFocus={() => openOnIntent(name)} onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) closeOnLeave()
            }}>
              <button ref={(node) => { triggers.current[name] = node }} className={links.some(([, path]) => path === root) ? 'active-area' : ''}
                aria-expanded={open} aria-controls={`nav-${name}`} onClick={() => { clearTimeout(openTimer.current); setGroup(group === name ? null : name); setHoverGroup(null) }}>{t(...groupLabel)}</button>
              <div className={`nav-group-links${open ? ' is-open' : ''}`} id={`nav-${name}`} aria-hidden={!open} inert={!open}>
                {links.map(([label, path, description, Icon]) => <a key={path} href={`#/${path}`} aria-label={t(...label)} aria-current={root === path ? 'page' : undefined} onClick={close}>
                  <Icon size={17} aria-hidden="true" /><span><strong>{t(...label)}</strong><small>{t(...description)}</small></span><ArrowUpRight size={15} aria-hidden="true" />
                </a>)}
                {name === 'Archive' && lastMemory && <a className="last-memory-link" href={`#/timeline?era=${lastMemory.era}&memory=${lastMemory.id}`} onClick={close}><FileText size={17} aria-hidden="true" /><span><strong>{t('Lần khám phá gần nhất:', 'Last explored:')} {localize(lastMemory.title)}</strong><small>{t('Tiếp tục hành trình của bạn', 'Continue your journey')}</small></span><ArrowUpRight size={15} aria-hidden="true" /></a>}
              </div>
            </div>
          })}
          {mobile && <div className="mobile-nav-utilities">
            <a href="#/jummo" aria-current={root === 'jummo' ? 'page' : undefined} onClick={close}><Compass size={17} aria-hidden="true" />Jummo</a>
            <a href="#/orbit" aria-current={root === 'orbit' ? 'page' : undefined} onClick={close}><UserRound size={17} aria-hidden="true" />{t('Quỹ đạo của tôi', 'My Orbit')}</a>
            {!auth.session && <button className="header-signin" onClick={() => { close(); openAuth('signin') }} disabled={auth.loading}>{t('Đăng nhập', 'Sign in')}</button>}
          </div>}
        </nav>
        <div className="header-utilities">
          <a className="jummo-cta" href="#/jummo" aria-current={root === 'jummo' ? 'page' : undefined} onClick={close}><img src="/images/jummo-mascot.png" alt="" width="30" height="30" /> <span>Jummo</span></a>
          {!mobile && <a className="account-button" aria-label={t('Quỹ đạo của tôi / tài khoản', 'My Orbit / account')} href="#/orbit" onClick={close}>
            <UserRound size={16} /><span>{t('Quỹ đạo của tôi', 'My Orbit')}</span>
          </a>}
          {!mobile && !auth.session && <button className="header-signin" onClick={() => openAuth('signin')} disabled={auth.loading}>{t('Đăng nhập', 'Sign in')}</button>}
          <LanguageSelect />
          <ThemeToggle compact />
        </div>
        <button ref={menuButton} className="icon-button menu-button" aria-label={expanded ? t('Đóng menu', 'Close menu') : t('Mở menu', 'Open menu')} aria-expanded={expanded} aria-controls="main-nav" onClick={(event) => {
          clearTimeout(openTimer.current); setExpanded(!expanded); setGroup(null); setHoverGroup(null)
          if (mobile && !expanded && event.detail === 0) requestAnimationFrame(() => header.current?.querySelector('.main-nav > a')?.focus())
        }}>
          {expanded ? <X /> : <Menu />}
        </button>
      </div>
    </div>
    </>
  )
}
