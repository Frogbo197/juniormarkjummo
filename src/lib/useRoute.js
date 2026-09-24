import { useEffect, useState } from 'react'
// Hash route hoạt động khi refresh trên static hosting, không cần server rewrite.
export default function useRoute() {
  const [hash, setHash] = useState(() => location.hash)
  useEffect(() => {
    const change = () => setHash(location.hash)
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [])
  const path = hash.startsWith('#/') ? hash.slice(2).split('?')[0] : 'studio'
  useEffect(() => {
    const id = new URLSearchParams(hash.split('?')[1]).get('section')
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    else if (hash.startsWith('#/')) {
      window.scrollTo(0, 0)
      document.querySelector('main h1')?.focus({ preventScroll: true })
    }
  }, [hash])
  return path || 'studio'
}
