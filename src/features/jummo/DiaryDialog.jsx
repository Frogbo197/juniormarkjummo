import { useEffect, useRef, useState } from 'react'
import Dialog from '../../components/Dialog'
import { useAuth } from '../auth/authContext'
import { apiClient } from '../../lib/apiClient'
import { validateNote } from '../account/account'
import { t, useLanguage } from '../../i18n/language'

export default function DiaryDialog({ onClose, openAuth }) {
  useLanguage()
  const auth = useAuth()
  if (auth?.loading) return <Dialog title={t('Nhật ký của bạn', 'Your diary')} onClose={onClose} className="jr-dialog"><p role="status">{t('Đang kiểm tra phiên đăng nhập…', 'Checking your session…')}</p></Dialog>
  if (!auth?.session?.user?.id) return <Dialog title={t('Nhật ký của bạn', 'Your diary')} onClose={onClose} className="jr-dialog">
    <p>{t('Đăng nhập để viết nhật ký riêng tư và đọc lại trên các thiết bị của bạn.', 'Sign in to write a private diary and read it again on your devices.')}</p>
    {openAuth ? <button type="button" className="jr-primary-button" onClick={() => { onClose(); openAuth('signin') }}>{t('Đăng nhập để viết', 'Sign in to write')}</button> : <a className="jr-primary-button" href="/#/account">{t('Đăng nhập để viết', 'Sign in to write')}</a>}
  </Dialog>
  // A different account must never inherit the previous account's draft/list.
  return <DiaryWorkspace key={auth.session.user.id} userId={auth.session.user.id} onClose={onClose} />
}

function DiaryWorkspace({ userId, onClose }) {
  const { locale } = useLanguage()
  const [notes, setNotes] = useState([])
  const [draft, setDraft] = useState({ title: '', body: '' })
  const [selected, setSelected] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [pending, setPending] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const alive = useRef(false)
  const lock = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    let active = true
    async function load() {
      const entries = []
      for (let offset = 0; ; offset += 100) {
        const result = await apiClient.from('user_notes').select('id,title,body,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).order('id').range(offset, offset + 99)
        if (!active) return
        if (result.error || !Array.isArray(result.data)) throw new Error('load')
        entries.push(...result.data)
        if (result.data.length < 100) break
      }
      if (active) setNotes(entries)
    }
    load().catch(() => { if (active) setLoadError(true) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId, retry])

  function go(destination) {
    if (lock.current) return
    if (dirty) { setPending(destination); return }
    apply(destination)
  }
  function apply(destination) {
    setPending(null)
    if (destination.type === 'close') { onClose(); return }
    const note = destination.note
    setSelected(note?.id || null)
    setDraft({ title: note?.title || '', body: note?.body || '' })
    setDirty(false); setError(''); setMessage('')
  }
  function edit(field, value) {
    setDraft((old) => ({ ...old, [field]: value }))
    setDirty(true); setMessage(''); setError('')
  }
  async function save(event) {
    event.preventDefault()
    if (lock.current || loading || loadError) return
    const invalid = validateNote(draft)
    if (invalid) { setError(invalid); return }
    lock.current = true; setBusy(true); setError(''); setMessage('')
    try {
      const values = { title: draft.title.trim(), body: draft.body }
      const query = selected
        ? apiClient.from('user_notes').update(values).eq('id', selected).eq('user_id', userId)
        : apiClient.from('user_notes').insert({ ...values, user_id: userId })
      const result = await query.select('id,title,body,updated_at').single()
      if (result.error || !result.data?.id) throw new Error('save')
      if (alive.current) {
        setNotes((old) => [result.data, ...old.filter((note) => note.id !== result.data.id)])
        setSelected(result.data.id); setDraft({ title: result.data.title, body: result.data.body }); setDirty(false)
        setMessage(t('Đã lưu nhật ký riêng tư.', 'Private diary entry saved.'))
      }
    } catch {
      if (alive.current) setError(t('Chưa lưu được nhật ký. Nội dung đang viết vẫn còn, hãy thử lại.', 'Could not save your diary. Your draft is still here; please try again.'))
    } finally { lock.current = false; if (alive.current) setBusy(false) }
  }

  return <Dialog title={t('Nhật ký của bạn', 'Your diary')} onClose={() => go({ type: 'close' })} className="jr-dialog jr-diary-dialog">
    <p className="jr-diary-note">{t('Chỉ bạn đọc được. Nhật ký được lưu cùng Ghi chú trong Góc cá nhân.', 'Only you can read this. Entries also appear in Notes in Your space.')}</p>
    {pending && <div className="jr-diary-confirm" role="alert">
      <p>{t('Bạn còn nội dung chưa lưu. Bỏ thay đổi này?', 'You have an unsaved draft. Discard these changes?')}</p>
      <button type="button" onClick={() => setPending(null)}>{t('Viết tiếp', 'Keep writing')}</button>
      <button type="button" onClick={() => apply(pending)}>{t('Bỏ thay đổi', 'Discard changes')}</button>
    </div>}
    {loading ? <p role="status">{t('Đang tải nhật ký…', 'Loading your diary…')}</p> : loadError ? <div role="alert"><p>{t('Chưa tải được nhật ký. Vui lòng thử lại.', 'Could not load your diary. Please try again.')}</p><button type="button" onClick={() => { setLoadError(false); setLoading(true); setRetry((n) => n + 1) }}>{t('Thử lại', 'Try again')}</button></div> : <div className="jr-diary-grid">
      <aside className="jr-diary-list" aria-label={t('Nhật ký đã lưu', 'Saved diary entries')}>
        <button type="button" className="jr-primary-button" disabled={busy || !!pending} onClick={() => go({ type: 'new' })}>{t('+ Trang mới', '+ New entry')}</button>
        {!notes.length && <p>{t('Trang đầu tiên đang chờ bạn.', 'Your first page is waiting for you.')}</p>}
        {notes.map((note) => <button type="button" key={note.id} disabled={busy || !!pending} aria-pressed={selected === note.id} onClick={() => go({ type: 'select', note })}><strong>{note.title}</strong><small>{new Date(note.updated_at).toLocaleDateString(locale)}</small></button>)}
      </aside>
      <form onSubmit={save} className="jr-diary-form">
        <label htmlFor="jr-diary-title">{t('Tiêu đề', 'Title')}</label>
        <input id="jr-diary-title" value={draft.title} onChange={(event) => edit('title', event.target.value)} maxLength={120} required disabled={busy || !!pending} />
        <label htmlFor="jr-diary-body">{t('Hôm nay của bạn thế nào?', 'How was your day?')}</label>
        <textarea id="jr-diary-body" value={draft.body} onChange={(event) => edit('body', event.target.value)} maxLength={10000} rows={9} disabled={busy || !!pending} />
        <span className="jr-diary-count">{draft.body.length.toLocaleString(locale)} / 10.000</span>
        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
        <button className="jr-primary-button" disabled={busy || !!pending || !dirty} type="submit">{busy ? t('Đang lưu…', 'Saving…') : t('Lưu nhật ký', 'Save diary')}</button>
      </form>
    </div>}
  </Dialog>
}
