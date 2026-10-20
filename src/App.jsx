import { t, useLanguage, localize } from './i18n/language'
import { useEffect, useState } from 'react'
import AccountPage from './features/account/AccountPage'
import PasswordForm from './features/auth/PasswordForm'
import SaveToOrbit from './components/SaveToOrbit'
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
import './styles/glass.css'
import './styles/rhythm.css'

function HomePage({ setPlayerSlot }) {
  useLanguage()
  const auth = useAuth()
  const route = useRoute()
  const [dialog, setDialog] = useState(null)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const openAuth = (mode) => setDialog({ type: 'auth', mode })
  const openAccount = () => {
    location.hash = '/account'
  }
  useEffect(() => {
    try { document.documentElement.dataset.reduceMotion = localStorage.getItem('jm-reduce-motion') === 'true' ? 'true' : 'false' } catch { /* Cài đặt vẫn dùng được trong phiên. */ }
  }, [])
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
        {t("Đi đến nội dung chính", "Skip to main content")}
      </a>
      <Header auth={auth} openAuth={openAuth} route={route} />
      {/* 1. Các khối trang chủ theo thứ tự frame Studio Home trong Figma. */}
      <main className={`page-content mode-${['studio', 'timeline', 'profiles', 'jummo', 'sky'].includes(route) ? 'immersive' : route.startsWith('profiles/') || route === 'media' ? 'editorial' : 'utility'}`} id="main" tabIndex={-1}>
      {route !== 'studio' && <JummoCompanion route={route} />}
        {route === 'studio' ? (
          <>
            <Hero />
            <JummoCompanion route={route} />
            <ArchiveDashboard />
            <div id="record-player" ref={setPlayerSlot} />
            <Birthdays />
            <Jummo />
            <Highlights openStory={(story) => setDialog({ type: 'story', ...story })} />
            <Gallery openPhoto={(photo) => setDialog({ type: 'photo', ...photo })} />
            <section className="explore-grid" aria-label={t("Khám phá cộng đồng", "Explore the community")}>
              <button
                className="explore-card"
                onClick={() => {
                  location.hash = '/timeline'
                }}
              >
                <div>
                  <Orbit size={22} />
                  <span className="eyebrow">{t("HÀNH TRÌNH CỦA CHÚNG MÌNH", "OUR JOURNEY")}</span>
                </div>
                <h2>{t("Dòng thời gian tinh tú", "Constellation Timeline")}</h2>
                <p>{t("Những vai diễn, những dấu mốc, một hành trình được lưu lại bằng yêu thương.", "Roles, milestones, and a journey preserved with love.")}</p>
                <strong>
                  {t("Khám phá chòm sao kỷ niệm", "Explore the constellation of memories")} <ArrowUpRight size={16} />
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
                  <span className="eyebrow">{t("GIAI ĐIỆU NGƯỜI HÂM MỘ", "FAN MELODIES")}</span>
                </div>
                <h2>{t("Bức tường giai điệu", "Wall of Melody")}</h2>
                <p>
                  {t("Mỗi người hâm mộ là một nốt nhạc. Cùng trở thành một phần của tiệm đĩa JuniorMark.", "Every fan is a musical note. Become part of the JuniorMark record store.")}
                </p>
                <strong>
                  {t("Gắn nốt nhạc của bạn", "Leave your musical note")} <ArrowUpRight size={16} />
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
          <JummoWorld openPhoto={openPhoto} showInfo={showInfo} openAuth={openAuth} />
        ) : route === 'account' ? (
          <AccountPage openAuth={openAuth} />
        ) : route === 'orbit' ? (
          <MyOrbit openAuth={openAuth} openAccount={openAccount} />
        ) : route === 'projects' ? (
          <Projects showInfo={showInfo} />
        ) : (
          <section className="archive-panel">
            <h1>{t("Chưa tìm thấy trang này", "Page not found")}</h1>
            <a href="#/studio">{t("Về phòng thu", "Back to Studio")}</a>
          </section>
        )}
      </main>
      <Footer />
      {auth.passwordMessage && <p className="notice" role="status">{localize(auth.passwordMessage)}</p>}
      {auth.recoveryOpen && <Dialog title={t("Khôi phục mật khẩu", "Reset password")} onClose={auth.dismissRecovery}><PasswordForm auth={auth}/></Dialog>}
      {dialog?.type === 'info' && (
        <Dialog title={localize(dialog.title)} onClose={close}>
          <p style={{ whiteSpace: 'pre-line' }}>{localize(dialog.body)}</p>
        </Dialog>
      )}
      {/* 2. Các hộp thoại dùng chung cơ chế focus, Escape và nền che. */}
      {dialog?.type === 'auth' && <AuthDialog mode={dialog.mode} auth={auth} onClose={close} />}
      {dialog?.type === 'photo' && (
        <Dialog title={localize(dialog.title)} onClose={close} className="photo-dialog">
          <img className="lightbox-image" src={dialog.src} alt={localize(dialog.alt)} />
          <p className="muted">{localize(dialog.credit)}</p>
          <SaveToOrbit kind="photo" id={dialog.file || dialog.src} payload={{title:dialog.title,url:dialog.src,credit:dialog.credit}}/>
          {dialog.memoryId && <a className="text-button" href={`#/timeline?era=${dialog.era}&memory=${dialog.memoryId}`} onClick={close}>{t("Khám phá kỷ niệm liên quan ↗", "Explore related memory ↗")}</a>}
          {dialog.era && <a className="text-button" href={`#/media?era=${dialog.era}`} onClick={close}>{t("Khám phá giai đoạn liên quan ↗", "Explore editorial era ↗")}</a>}
          {dialog.person && dialog.person !== 'jummo' && <a className="text-button" href={`#/profiles/${dialog.person}`} onClick={close}>{t("Khám phá hồ sơ ↗", "Explore profile ↗")}</a>}
          {dialog.source && (
            <a
              className="text-button photo-credit-link"
              href={dialog.source}
              target="_blank"
              rel="noreferrer"
            >
              {t("Xem bài đăng gốc ↗", "View original post ↗")}
            </a>
          )}
        </Dialog>
      )}
      {dialog?.type === 'story' && (
        <Dialog title={localize(dialog.title)} onClose={close}>
          <img className="story-dialog-image" src={dialog.image} alt={t("Ảnh minh họa bộ sưu tập", "Collection illustration")} />
          <p>{localize(dialog.detail)}</p>
          <SaveToOrbit kind="page" id={'story:'+dialog.title} payload={{title:dialog.title,url:'#/studio',excerpt:dialog.detail}}/>
          <a
            className="primary-button"
            href="https://www.youtube.com/@gmmtv"
            target="_blank"
            rel="noreferrer"
          >
            {t("Ghé kênh GMMTV", "Visit GMMTV")} <ArrowUpRight size={16} />
          </a>
        </Dialog>
      )}
      {dialog?.type === 'account' && (
        <Dialog title={t("Góc nhỏ của bạn", "Your little corner")} onClose={logoutBusy ? () => {} : close}>
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
                  t('Bạn yêu của Jummo', 'Jummo’s dear friend')}
              </h3>
              <p className="account-email">{auth.session.user.email}</p>
              <p className="dialog-intro">{t("Chào mừng bạn đến với tiệm đĩa JuniorMark.", "Welcome to the JuniorMark record store.")}</p>
              {auth.profileError && (
                <p className="notice" role="status">
                  {localize(auth.profileError)}
                </p>
              )}
              {logoutError && (
                <p className="error-message" role="alert">
                  {localize(logoutError)}
                </p>
              )}
              <button
                className="primary-button submit-button"
                disabled={logoutBusy}
                onClick={logout}
              >
                {logoutBusy ? <LoaderCircle className="spin" size={17} /> : <LogOut size={17} />}
                {logoutBusy ? t('Đang đăng xuất…', 'Signing out…') : t('Đăng xuất', 'Sign out')}
              </button>
            </>
          ) : (
            <p>{t("Bạn đã đăng xuất. Hẹn gặp lại ở tiệm đĩa!", "You are signed out. See you at the record store!")}</p>
          )}
        </Dialog>
      )}
    </>
  )
}

export default function App() {
  useLanguage()
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


