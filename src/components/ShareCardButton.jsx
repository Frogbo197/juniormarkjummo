import { useState } from 'react'
import { cardText, exportCardPng } from '../lib/shareCard'
import { downloadText } from '../lib/archive'
export default function ShareCardButton({ card, filename = 'juniormark-card', label = 'Download PNG card' }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function download() {
    setBusy(true); setError('')
    try { await exportCardPng(card, filename) } catch { setError('PNG export is unavailable. You can save the text version below.') } finally { setBusy(false) }
  }
  return <div className="share-card-action"><button className="primary-button" disabled={busy} onClick={download}>{busy ? 'Preparing card…' : label}</button>{error && <><p role="status">{error}</p><button className="text-button" onClick={() => downloadText(`${filename}.txt`, cardText(card))}>Download text fallback</button></>}</div>
}
