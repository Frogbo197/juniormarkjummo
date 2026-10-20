// Explicit development preview: does not change the main site's API startup.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './pages/Pages.css'
import './jummo-room-preview.css'
import JummoWorld from './pages/JummoWorld'
import Dialog from './components/Dialog'
import AuthProvider from './features/auth/AuthProvider'
import AuthDialog from './features/auth/AuthDialog'
import { useAuth } from './features/auth/authContext'

document.documentElement.dataset.theme = 'light'

export default function Preview() {
  const auth = useAuth()
  const [photo, setPhoto] = useState(null)
  const [authMode, setAuthMode] = useState(null)
  return <main className="jummo-preview">
    <JummoWorld openPhoto={setPhoto} openAuth={setAuthMode} />
    {photo && <Dialog title={photo.title} onClose={() => setPhoto(null)}><img src={photo.src} alt={photo.alt} /><p>{photo.credit}</p></Dialog>}
    {authMode && <AuthDialog mode={authMode} auth={auth} onClose={() => setAuthMode(null)} />}
  </main>
}

createRoot(document.getElementById('root')).render(
  <StrictMode><AuthProvider><Preview /></AuthProvider></StrictMode>,
)
