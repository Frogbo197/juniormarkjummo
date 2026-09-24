import { useState } from 'react'
import { useAuth } from '../features/auth/authContext'
import useMessages from '../features/community/useMessages'
import { playNote } from '../lib/archive'
import { Chips, Empty, PageIntro, Quiz, SectionTitle } from './shared'
import SkyExperience from './SkyExperience'
import { useOrbit } from '../features/orbit/orbitContext'
import { safeMessageDate } from '../lib/starLayout'
import Dialog from '../components/Dialog'
import SaveToOrbit from '../components/SaveToOrbit'

const spectra = [
  ['all', 'Tất cả vì sao'],
  ['junior', 'Junior Ánh Dương'],
  ['mark', 'Mark Ánh Nguyệt'],
  ['jummo', 'Jummo Sunflower'],
]
export default function Community({ kind = 'star', openAuth }) {
  const orbit = useOrbit()
  // Dùng chung form và dữ liệu cho Starry Sky/Wall; từng loại lưu ở không gian riêng.
  const auth = useAuth(),
    api = useMessages(kind, auth.session?.user.id),
    isSky = kind === 'star'
  const [filter, setFilter] = useState('all'),
    [form, setForm] = useState({ name: '', country: '', body: '', spectrum: 'jummo' }),
    [skySubmission, setSkySubmission] = useState(null),
    [notice, setNotice] = useState(''),
    [error, setError] = useState(''),
    [selected, setSelected] = useState(null)
  const visible = api.messages.filter((m) => filter === 'all' || m.spectrum === filter)
  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  async function submit(e) {
    e.preventDefault()
    const source = (
      e.nativeEvent.submitter || e.currentTarget.querySelector('button.primary-button')
    )?.getBoundingClientRect()
    const origin = source
      ? { x: source.left + source.width / 2, y: source.top + source.height / 2 }
      : null
    const previousIds = api.messages.map((item) => item.id)
    setError('')
    setNotice('')
    try {
      const message = await api.submit(form)
      if (message) {
        if (isSky && orbit) await orbit.save('progress', 'star', { demo: api.demo })
        if (isSky) setSkySubmission({ origin, previousIds, form: { ...form }, at: Date.now() })
        setNotice(message)
        field('body', '')
      }
    } catch (e) {
      setError(e.message)
    }
  }
  async function inspect(m, i) {
    setSelected(m)
    await playNote(i)
  }
  const wishForm = (
    <form
      className={`archive-panel community-form spectrum-${form.spectrum}`}
      onSubmit={submit}
      noValidate
    >
      <SectionTitle eyebrow={isSky ? 'THẮP SÁNG NGUYỆN ƯỚC' : 'BẢN PHÍM GIAO HƯỞNG'}>
        {isSky ? 'Phóng Ngôi Sao Lên Bầu Trời' : 'Gõ Nốt Nhạc Của Bạn'}
      </SectionTitle>
      <label>
        Tên hiển thị / Fandom nickname
        <input
          value={form.name}
          maxLength={50}
          onChange={(e) => field('name', e.target.value)}
          placeholder="Tên của bạn"
        />
      </label>
      <label>
        Quốc gia / Thành phố
        <input
          value={form.country}
          maxLength={60}
          onChange={(e) => field('country', e.target.value)}
          placeholder="Hà Nội, Bangkok…"
        />
      </label>
      <Chips
        label="Chọn bản sắc"
        options={spectra.slice(1)}
        value={form.spectrum}
        onChange={(v) => field('spectrum', v)}
      />
      <label>
        Lời chúc / Tâm nguyện
        <textarea
          value={form.body}
          maxLength={200}
          onChange={(e) => field('body', e.target.value)}
          rows={4}
        />
      </label>
      <small>{form.body.length}/200 ký tự</small>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {!api.demo && !auth.session ? (
        <button type="button" className="primary-button" onClick={() => openAuth('signin')}>
          Đăng nhập để gửi
        </button>
      ) : (
        <button className="primary-button" disabled={api.busy}>
          {api.busy
            ? 'Đang gửi…'
            : api.demo
              ? 'Lưu nguyện ước xem thử'
              : isSky
                ? 'Phóng ngôi sao'
                : 'Thả nốt nhạc lên tường'}
        </button>
      )}
    </form>
  )
  if (isSky)
    return (
      <SkyExperience
        key={auth.session?.user.id || 'guest'}
        api={api}
        userId={auth.session?.user.id}
        submission={skySubmission}
        notice={notice}
        spectra={spectra}
      >
        {wishForm}
      </SkyExperience>
    )
  return (
    <>
      <PageIntro
        eyebrow="FAN RESONANCE & INTERACTIVE CHAMBER"
        title="The Jam Session & Wall of Melody"
        description="Gửi lời nhắn trên những nốt đàn, cùng Jummo lưu giữ giai điệu từ trái tim bạn."
      >
        <div className="stat-pill">
          <strong>{api.messages.length}</strong>
          <span>NỐT NHẠC {api.demo ? 'TRÊN MÁY NÀY' : 'ĐÃ DUYỆT'}</span>
        </div>
      </PageIntro>
      <p className="notice">
        {api.demo
          ? 'Đang ở chế độ xem thử: lời nhắn chỉ lưu trên trình duyệt này.'
          : 'Lời nhắn mới cần được duyệt trước khi xuất hiện công khai.'}{' '}
        Âm thanh tương tác là nốt nhạc tổng hợp.
      </p>
      {api.error && (
        <p className="error-message" role="alert">
          {api.error}
        </p>
      )}
      <div className="toolbar">
        <Chips label="Lọc bản sắc" options={spectra} value={filter} onChange={setFilter} />
      </div>
      <div className="notes-grid">
        {visible.map((m, i) => (
          <article className={`archive-panel note-card ${m.spectrum}`} key={m.id}>
            <button
              className="text-button"
              aria-label={`Nghe nốt nhạc của ${m.name}`}
              onClick={() => playNote(i)}
            >
              ♫ {m.spectrum.toUpperCase()}
            </button>
            <blockquote>“{m.body}”</blockquote>
            <p>
              {m.name} · {m.country}
            </p>
            <button className="text-button" onClick={() => inspect(m, i)}>
              Open star details ↗
            </button>
            <SaveToOrbit kind="favorite" id={m.id} payload={{ name: m.name, kind }} />
          </article>
        ))}
        {!visible.length && <Empty>Chưa có nốt nhạc trong bộ lọc này.</Empty>}
      </div>
      {selected && (
        <Dialog title={selected.name} onClose={() => setSelected(null)}>
          <p>{selected.body}</p>
          <p>Declared location: {selected.country}</p>
          <p>Spectrum: {selected.spectrum}</p>
          <p>{safeMessageDate(selected.created_at)} · UTC+7</p>
          <SaveToOrbit kind="favorite" id={selected.id} payload={{ name: selected.name, kind }} />
        </Dialog>
      )}
      <div className="two-columns">
        {wishForm}
        <aside className="archive-panel">
          <SectionTitle eyebrow="FANDOM CONNECTION">Support & Voting Assistant Hub</SectionTitle>
          <p>Soạn lời cổ vũ của riêng bạn, xem nguồn thông báo và hướng dẫn dành cho fan mới.</p>
          <a className="primary-button" href="#/projects">
            Mở Fan Projects & Cẩm nang →
          </a>
          <p className="muted">Không có chiến dịch bình chọn nào đã được cấu hình.</p>
        </aside>
      </div>
      <Quiz />
    </>
  )
}
