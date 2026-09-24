import { useOrbit } from '../features/orbit/orbitContext'
export default function SaveToOrbit({ kind, id, payload = {} }) {
  const orbit = useOrbit()
  if (!orbit) return null
  const saved = orbit.has(kind, id)
  return <div className="orbit-save"><button className="secondary-button" aria-pressed={saved} disabled={orbit.loading || orbit.busy} onClick={() => orbit.save(kind, id, payload, saved)}>{saved ? 'Saved · Remove from My Orbit' : 'Save to My Orbit'}</button>{orbit.error && <p role="status" className="error-message">{orbit.error}</p>}</div>
}

