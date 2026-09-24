import { useState } from 'react'
import { ArrowUpRight, Heart, LoaderCircle, LogOut, Orbit } from 'lucide-react'
import Header from './components/Header'
import Hero from './components/Hero'
import ArchiveDashboard from './components/ArchiveDashboard'
import RecordPlayer from './components/RecordPlayer'
import Birthdays from './components/Birthdays'
import Jummo from './components/Jummo'
import Highlights from './components/Highlights'
import Gallery from './components/Gallery'
import Footer from './components/Footer'
import Dialog from './components/Dialog'
import AuthProvider from './features/auth/AuthProvider'
import { useAuth } from './features/auth/authContext'
import AuthDialog from './features/auth/AuthDialog'
import './App.css'
import './pages/Pages.css'
import useRoute from './lib/useRoute'
import CharacterStage from './pages/CharacterStage'
import Profiles from './pages/Profiles'
import Timeline from './pages/Timeline'
import MediaHub from './pages/MediaHub'
import Schedule from './pages/Schedule'
import Community from './pages/Community'
import JummoWorld from './pages/JummoWorld'
import Projects from './pages/Projects'
import MyOrbit from './pages/MyOrbit'
import OrbitProvider from './features/orbit/OrbitProvider'
import JummoCompanion from './components/JummoCompanion'

function HomePage({ setPlayerSlot }) {
  const auth = useAuth()
  const route = useRoute()
  const [dialog, setDialog] = useState(null)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const openAuth = (mode) => setDialog({ type: 'auth', mode })
  const openAccount = () => {
    setLogoutError('')
    setDialog({ type: 'account' })
  }
  const close = () => setDialog(null)
  const openPhoto = (photo) => setDialog({ type: 'photo', ...photo })
  const showInfo = (title, body) => setDialog({ type: 'info', title, body })
  async function logout() {
    if (logoutBusy) return
    setLogoutBusy(true)
    setLogoutError('')
    try {
      await auth.signOut()
      close()
    } catch (error) {
      setLogoutError(error.message)
    } finally {
      setLogoutBusy(false)
    }
  }
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          const main = document.getElementById('main')
          main?.focus()
          main?.scrollIntoView()
        }}
      >
        Đi đến nội dung chính
      </a>
      <Header auth={auth} openAuth={openAuth} route={route} />
      {/* 1. Các khối trang chủ theo thứ tự frame Studio Home trong Figma. */}
      <main className={`page-content mode-${['studio', 'timeline', 'profiles', 'jummo', 'sky'].includes(route) ? 'immersive' : route.startsWith('profiles/') || route === 'media' ? 'editorial' : 'utility'}`} id="main" tabIndex={-1}>
      <JummoCompanion route={route} />
        {route === 'studio' ? (
          <>
            <Hero />
            <ArchiveDashboard />
            <div id="record-player" ref={setPlayerSlot} />
            <Birthdays />
            <Jummo />
            <Highlights openStory={(story) => setDialog({ type: 'story', ...story })} />
            <Gallery openPhoto={(photo) => setDialog({ type: 'photo', ...photo })} />
            <section className="explore-grid" aria-label="Khám phá cộng đồng">
              <button
                className="explore-card"
                onClick={() => {
                  location.hash = '/timeline'
                }}
              >
                <div>
                  <Orbit size={22} />
                  <span className="eyebrow">OUR JOURNEY</span>
                </div>
                <h2>Constellation Timeline</h2>
                <p>Những vai diễn, những dấu mốc, một hành trình được lưu lại bằng yêu thương.</p>
                <strong>
                  Khám phá chòm sao kỷ niệm <ArrowUpRight size={16} />
                </strong>
              </button>
              <button
                className="explore-card"
                onClick={() => {
                  location.hash = '/wall'
                }}
              >
                <div>
                  <Heart size={22} />
                  <span className="eyebrow">FAN MELODIES</span>
                </div>
                <h2>Wall of Melody</h2>
                <p>
                  Mỗi người hâm mộ là một nốt nhạc. Cùng trở thành một phần của tiệm đĩa JuniorMark.
                </p>
                <strong>
                  Gắn nốt nhạc của bạn <ArrowUpRight size={16} />
                </strong>
              </button>
            </section>
          </>
        ) : route === 'profiles' ? (
          <CharacterStage />
        ) : route.startsWith('profiles/') ? (
          <Profiles
            key={route}
            person={['junior', 'mark'].includes(route.split('/')[1]) ? route.split('/')[1] : 'duo'}
          />
        ) : route === 'timeline' ? (
          <Timeline openPhoto={openPhoto} />
        ) : route === 'media' ? (
          <MediaHub openPhoto={openPhoto} />
        ) : route === 'schedule' ? (
          <Schedule showInfo={showInfo} />
        ) : route === 'sky' || route === 'wall' ? (
          <Community
            key={route}
            kind={route === 'sky' ? 'star' : 'note'}
            openAuth={openAuth}
          />
        ) : route === 'jummo' ? (
          <JummoWorld openPhoto={openPhoto} showInfo={showInfo} />
        ) : route === 'orbit' || route === 'account' ? (
          <MyOrbit openAuth={openAuth} openAccount={openAccount} />
        ) : route === 'projects' ? (
          <Projects showInfo={showInfo} />
        ) : (
          <section className="archive-panel">
            <h1>Chưa tìm thấy trang này</h1>
            <a href="#/studio">Về Studio</a>
          </section>
        )}
      </main>
      <Footer />
      {dialog?.type === 'info' && (
        <Dialog title={dialog.title} onClose={close}>
          <p style={{ whiteSpace: 'pre-line' }}>{dialog.body}</p>
        </Dialog>
      )}
      {/* 2. Các hộp thoại dùng chung cơ chế focus, Escape và nền che. */}
      {dialog?.type === 'auth' && <AuthDialog mode={dialog.mode} auth={auth} onClose={close} />}
      {dialog?.type === 'photo' && (
        <Dialog title={dialog.title} onClose={close} className="photo-dialog">
          <img className="lightbox-image" src={dialog.src} alt={dialog.alt} />
          <p className="muted">{dialog.credit}</p>
          {dialog.memoryId && <a className="text-button" href={`#/timeline?era=${dialog.era}&memory=${dialog.memoryId}`} onClick={close}>Explore related memory ↗</a>}
          {dialog.era && <a className="text-button" href={`#/media?era=${dialog.era}`} onClick={close}>Explore editorial era ↗</a>}
          {dialog.person && dialog.person !== 'jummo' && <a className="text-button" href={`#/profiles/${dialog.person}`} onClick={close}>Explore profile ↗</a>}
          {dialog.source && (
            <a
              className="text-button photo-credit-link"
              href={dialog.source}
              target="_blank"
              rel="noreferrer"
            >
              Xem bài đăng gốc ↗
            </a>
          )}
        </Dialog>
      )}
      {dialog?.type === 'story' && (
        <Dialog title={dialog.title} onClose={close}>
          <img className="story-dialog-image" src={dialog.image} alt="Ảnh minh họa bộ sưu tập" />
          <p>{dialog.detail}</p>
          <a
            className="primary-button"
            href="https://www.youtube.com/@gmmtv"
            target="_blank"
            rel="noreferrer"
          >
            Ghé kênh GMMTV <ArrowUpRight size={16} />
          </a>
        </Dialog>
      )}
      {dialog?.type === 'account' && (
        <Dialog title="Góc nhỏ của bạn" onClose={logoutBusy ? () => {} : close}>
          {auth.session ? (
            <>
              <div className="account-avatar">
                {(
                  auth.profile?.display_name ||
                  auth.session.user.user_metadata?.display_name ||
                  'F'
                )
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <h3 className="account-name">
                {auth.profile?.display_name ||
                  auth.session.user.user_metadata?.display_name ||
                  'Bạn yêu của Jummo'}
              </h3>
              <p className="account-email">{auth.session.user.email}</p>
              <p className="dialog-intro">Chào mừng bạn đến với tiệm đĩa JuniorMark.</p>
              {auth.profileError && (
                <p className="notice" role="status">
                  {auth.profileError}
                </p>
              )}
              {logoutError && (
                <p className="error-message" role="alert">
                  {logoutError}
                </p>
              )}
              <button
                className="primary-button submit-button"
                disabled={logoutBusy}
                onClick={logout}
              >
                {logoutBusy ? <LoaderCircle className="spin" size={17} /> : <LogOut size={17} />}
                {logoutBusy ? 'Đang đăng xuất…' : 'Đăng xuất'}
              </button>
            </>
          ) : (
            <p>Bạn đã đăng xuất. Hẹn gặp lại ở tiệm đĩa!</p>
          )}
        </Dialog>
      )}
    </>
  )
}

export default function App() {
  const [playerSlot, setPlayerSlot] = useState(null)
  return (
    <AuthProvider>
      <OrbitProvider>
      <HomePage setPlayerSlot={setPlayerSlot} />
      <RecordPlayer heroTarget={playerSlot} />
      </OrbitProvider>
    </AuthProvider>
  )
}
