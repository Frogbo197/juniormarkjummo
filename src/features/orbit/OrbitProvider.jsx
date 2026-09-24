import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/authContext'
import { supabase } from '../../lib/supabase'
import { changeOrbitItems, loadOrbit, persistOrbitItem, readGuestOrbit, writeGuestOrbit } from '../../lib/orbit'

import { OrbitContext } from './orbitContext'
function OrbitSession({ children, userId, authLoading }) {
  const [items, setItems] = useState(() => userId ? [] : readGuestOrbit())
  const [loading, setLoading] = useState(Boolean(userId))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const current = useRef(items), lock = useRef(false), alive = useRef(true)
  useEffect(() => {
    alive.current = true
    if (userId) loadOrbit(supabase, userId).then((value) => { if (alive.current) { current.current = value; setItems(value) } }).catch((err) => { if (alive.current) setError(err.message) }).finally(() => { if (alive.current) setLoading(false) })
    return () => { alive.current = false }
  }, [userId])
  async function save(kind, id, payload = {}, remove = false) {
    if (lock.current || loading || authLoading) return false
    lock.current = true; setBusy(true); setError('')
    const item = { kind, item_id: id, payload }
    try {
      const next = changeOrbitItems(current.current, item, remove)
      if (userId) await persistOrbitItem(supabase, userId, item, remove)
      else writeGuestOrbit(next)
      if (alive.current) { current.current = next; setItems(next) }
      return true
    } catch (err) { if (alive.current) setError(err.message || 'My Orbit could not save. Please try again.'); return false }
    finally { lock.current = false; if (alive.current) setBusy(false) }
  }
  const has = (kind, id) => items.some((item) => item.kind === kind && item.item_id === id)
  return <OrbitContext.Provider value={{ items, has, save, loading: loading || authLoading, busy, error, userId }}>{children}</OrbitContext.Provider>
}
export default function OrbitProvider({ children }) {
  const auth = useAuth()
  const userId = auth.session?.user.id
  return <OrbitSession key={userId || 'guest'} userId={userId} authLoading={auth.loading}>{children}</OrbitSession>
}
