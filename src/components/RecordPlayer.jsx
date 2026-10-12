import { t, useLanguage } from '../i18n/language'
import { catalog } from '../data/catalog'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './RecordPlayer.css'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1, Heart } from 'lucide-react'

/* ───────────── Hằng số ───────────── */
const SPIN_DEG_PER_SEC = 360 / 20     // 1 vòng / 20s
const NEEDLE_DROP_MS = 800            // khớp transition của tonearm; đĩa chỉ quay sau khi kim hạ xong
const SEEK_SECONDS_PER_TURN = 6       // kéo đĩa 1 vòng = tua 6 giây
const LIKES_KEY = 'recordplayer:likes'
const NEXT_LOOP = { off: 'all', all: 'one', one: 'off' }

/* ───────────── Dữ liệu ───────────── */
/**
 * Lời bài hát (tuỳ chọn) lấy từ `lyrics` của catalog. Hỗ trợ:
 *  - mảng [{ time: giây, text }]
 *  - chuỗi LRC: "[01:23.50] Lời bài hát"
 */
function parseLyrics(raw) {
  if (Array.isArray(raw)) return raw.filter(l => Number.isFinite(l.time) && l.text).sort((a, b) => a.time - b.time)
  if (typeof raw !== 'string') return []
  const out = []
  for (const line of raw.split(/\r?\n/)) {
    const text = line.replace(/\[[^\]]*\]/g, '').trim()
    if (!text) continue
    for (const m of line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)) out.push({ time: Number(m[1]) * 60 + Number(m[2]), text })
  }
  return out.sort((a, b) => a.time - b.time)
}

const tracks = catalog.tracks.map(item => ({
  title: item.title,
  artist: item.subtitle,
  audioSrc: item.audio_url,
  album: 'JuniorMark • Sun & Moon',
  artwork: '/images/fan-photos/HNwNJ4GbsAE5PwW.jpg',
  spotifyUrl: item.source_url || 'https://open.spotify.com/search/' + encodeURIComponent(item.title),
  lyrics: parseLyrics(item.lyrics),
}))

const formatTime = (value) => Number.isFinite(value) ? `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.floor(value % 60).toString().padStart(2, '0')}` : '--:--'
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/* ───────────── Sóng âm (CSS thuần, không cần CORS cho Web Audio) ───────────── */
// 6 vệt mỏng, mỗi vệt có độ trễ / tốc độ / đỉnh riêng để nhịp trông tự nhiên.
const BARS = [
  { delay: 0, dur: .62, peak: 1 }, { delay: -.3, dur: .85, peak: .6 }, { delay: -.15, dur: .5, peak: .9 },
  { delay: -.45, dur: .74, peak: .7 }, { delay: -.2, dur: .58, peak: 1 }, { delay: -.55, dur: .9, peak: .5 },
]
const Visualizer = memo(function Visualizer({ active }) {
  return <span className={`vp-bars ${active ? 'is-active' : ''}`} aria-hidden="true">
    {BARS.map((b, i) => <i key={i} style={{ '--delay': `${b.delay}s`, '--dur': `${b.dur}s`, '--peak': b.peak }} />)}
  </span>
})

// Hạt bụi tinh tú: góc / kích thước cố định, nằm trên vòng quỹ đạo riêng.
const STARS = [0, 31, 58, 95, 130, 162, 199, 233, 262, 297, 330].map((a, i) => ({ a, s: 2 + (i % 3) }))

/* ───────────── Component chính ───────────── */
// App sở hữu instance này. Chỉ phần hero được portal vào route Studio.
// Bỏ trống heroTarget thì player render độc lập.
export default function RecordPlayer(props) {
  useLanguage()
  return tracks.length ? <Player {...props} /> : <p>{t("Chưa có bản nhạc.", "No tracks yet.")}</p>
}

function Player({ heroTarget } = {}) {
  const { language } = useLanguage()

  // — State giao diện —
  const [selected, setSelected] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [spinning, setSpinning] = useState(false)       // đĩa chỉ quay sau khi kim đã hạ
  const [isScratching, setIsScratching] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const [showMini, setShowMini] = useState(false)
  const [activeTab, setActiveTab] = useState('playlist') // 'playlist' | 'lyrics'
  const [loopMode, setLoopMode] = useState('off')        // 'off' | 'all' | 'one'
  const [shuffle, setShuffle] = useState(false)
  const [likedTitles, setLikedTitles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LIKES_KEY)) || [] } catch { return [] }
  })
  const [burst, setBurst] = useState(0)                  // đổi key để chạy lại hiệu ứng nổ tim

  // — Ref —
  const audio = useRef(null)
  const card = useRef(null)
  const active = useRef(0)
  const request = useRef(0)
  const wantsPlay = useRef(false)
  const shuffleRef = useRef(false)
  const lyricsRef = useRef(null)
  // Ref cho đĩa quay (rAF điều khiển trực tiếp DOM để không re-render mỗi frame)
  const wrapRef = useRef(null)
  const discRef = useRef(null)
  const angle = useRef(0)
  const velocity = useRef(0)
  const spinOn = useRef(false)
  const dragging = useRef(false)
  const lastPointer = useRef({ a: 0, t: 0 })
  const raf = useRef(0)
  const lastTs = useRef(0)
  const reducedMotion = useRef(false)

  const track = tracks[selected]
  const isLiked = likedTitles.includes(track.title)

  /* ── Âm thanh: khởi tạo / dọn dẹp ── */
  useEffect(() => {
    const element = audio.current
    const stop = () => {
      request.current++
      wantsPlay.current = false
      if (!element.paused) element.pause()
    }
    element.volume = 0.7
    return stop
  }, [])

  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { try { localStorage.setItem(LIKES_KEY, JSON.stringify(likedTitles)) } catch { /* optional */ } }, [likedTitles])

  /* ── Hiện mini player khi hero cuộn khỏi màn hình ── */
  useEffect(() => {
    const update = () => setShowMini(!card.current || card.current.getBoundingClientRect().bottom <= 0)
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (card.current) observer?.observe(card.current)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      observer?.disconnect()
    }
  }, [heroTarget])

  /* ── Cơ chế Hạ kim → đĩa quay; Nhấc kim → đĩa chậm dần ──
     isPlaying đổi → tonearm đổi class ngay (CSS transition .8s).
     `spinning` bật trễ NEEDLE_DROP_MS khi phát, tắt ngay khi dừng. */
  useEffect(() => {
    if (!isPlaying) { setSpinning(false); return }
    const id = setTimeout(() => setSpinning(true), NEEDLE_DROP_MS)
    return () => clearTimeout(id)
  }, [isPlaying])

  /* ── Vòng lặp quay đĩa (rAF) ──
     Vận tốc tiến dần về mục tiêu (quán tính): tăng tốc êm khi bắt đầu, giảm tốc dần khi dừng.
     Dùng JS thay vì CSS animation để cho phép kéo/scratch đĩa mà không bị giật góc. */
  const paintDisc = () => { if (discRef.current) discRef.current.style.transform = `rotate(${angle.current}deg)` }
  const frame = useCallback((now) => {
    const dt = Math.min(0.05, (now - lastTs.current) / 1000)
    lastTs.current = now
    if (!dragging.current) {
      const target = spinOn.current ? SPIN_DEG_PER_SEC : 0
      velocity.current += (target - velocity.current) * Math.min(1, dt * (target ? 2 : 1.4))
      angle.current = (angle.current + velocity.current * dt) % 360
      if (discRef.current) discRef.current.style.transform = `rotate(${angle.current}deg)`
      if (!target && Math.abs(velocity.current) < 0.5) { velocity.current = 0; raf.current = 0; return } // đã dừng hẳn
    }
    raf.current = requestAnimationFrame(frame)
  }, [])
  const kick = useCallback(() => {
    if (raf.current) return
    lastTs.current = performance.now()
    raf.current = requestAnimationFrame(frame)
  }, [frame])
  useEffect(() => {
    reducedMotion.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    return () => { cancelAnimationFrame(raf.current); raf.current = 0 }
  }, [])
  useEffect(() => { spinOn.current = spinning; kick() }, [spinning, kick])

  /* ── Kéo / xoay đĩa (chuột + cảm ứng) → tua nhạc ── */
  const pointerAngle = (e) => {
    const r = wrapRef.current.getBoundingClientRect()
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI
  }
  function onDiscDown(e) {
    if (e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    velocity.current = 0
    lastPointer.current = { a: pointerAngle(e), t: performance.now() }
    setIsScratching(true)
    kick()
  }
  function onDiscMove(e) {
    if (!dragging.current) return
    const a = pointerAngle(e)
    let d = a - lastPointer.current.a
    if (d > 180) d -= 360
    if (d < -180) d += 360
    const now = performance.now()
    const dt = (now - lastPointer.current.t) / 1000
    lastPointer.current = { a, t: now }
    angle.current = (angle.current + d + 360) % 360
    paintDisc()
    if (dt > 0) velocity.current = velocity.current * 0.6 + clamp(d / dt, -720, 720) * 0.4
    if (duration) { // xoay theo chiều kim đồng hồ = tua tới
      const next = clamp(audio.current.currentTime + (d / 360) * SEEK_SECONDS_PER_TURN, 0, duration)
      audio.current.currentTime = next
      setCurrentTime(next)
    }
  }
  function onDiscUp() {
    if (!dragging.current) return
    dragging.current = false
    if (performance.now() - lastPointer.current.t > 100) velocity.current = 0 // giữ yên rồi thả → không văng
    setIsScratching(false)
    kick()
  }

  /* ── Điều khiển phát ── */
  const playAudio = useCallback(async () => {
    const token = ++request.current
    wantsPlay.current = true
    setError('')
    try { await audio.current.play() }
    catch {
      if (token !== request.current) return
      wantsPlay.current = false
      setIsPlaying(false)
      setError('playback-error')
    }
  }, [])
  const pauseAudio = useCallback(() => {
    request.current++
    wantsPlay.current = false
    audio.current.pause()
    setIsPlaying(false)
  }, [])
  const selectTrack = useCallback((index) => {
    request.current++
    audio.current.pause()
    active.current = (index + tracks.length) % tracks.length
    setSelected(active.current)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    // Gán nguồn và phát ngay trong user gesture để chạy được trên mobile.
    audio.current.src = tracks[active.current].audioSrc
    audio.current.load()
    void playAudio()
  }, [playAudio])
  // Chỉ số bài kế tiếp/trước; khi shuffle bật, "tiếp theo" là bài ngẫu nhiên khác bài hiện tại.
  const step = useCallback((dir) => {
    if (shuffleRef.current && dir > 0 && tracks.length > 1) {
      return (active.current + 1 + Math.floor(Math.random() * (tracks.length - 1))) % tracks.length
    }
    return active.current + dir
  }, [])
  const goNext = useCallback(() => selectTrack(step(1)), [selectTrack, step])
  const goPrev = useCallback(() => {
    if (audio.current.currentTime > 3) { audio.current.currentTime = 0; setCurrentTime(0); return } // như máy nghe nhạc thật
    selectTrack(step(-1))
  }, [selectTrack, step])
  function togglePlay() {
    if (wantsPlay.current) pauseAudio()
    else void playAudio()
  }
  function handleEnded() {
    if (loopMode === 'one') { audio.current.currentTime = 0; void playAudio(); return }
    const isLast = active.current === tracks.length - 1
    if (loopMode === 'off' && !shuffle && isLast) { pauseAudio(); audio.current.currentTime = 0; setCurrentTime(0); return }
    goNext()
  }
  function seekTo(time) {
    const value = clamp(time, 0, duration || 0)
    audio.current.currentTime = value
    setCurrentTime(value)
  }
  function toggleLike() {
    setLikedTitles(prev => prev.includes(track.title) ? prev.filter(x => x !== track.title) : [...prev, track.title])
    if (!isLiked) setBurst(b => b + 1)
  }

  /* ── Media Session (phím media / màn hình khoá) ── */
  useEffect(() => {
    const session = navigator.mediaSession
    if (!session || typeof session.setActionHandler !== 'function') return
    const handlers = { play: () => { void playAudio() }, pause: pauseAudio, previoustrack: goPrev, nexttrack: goNext }
    const registered = []
    for (const [action, handler] of Object.entries(handlers)) {
      // Trình duyệt có thể chỉ hỗ trợ một phần action.
      try { session.setActionHandler(action, handler); registered.push(action) } catch { /* optional API */ }
    }
    return () => {
      for (const action of registered) {
        try { session.setActionHandler(action, null) } catch { /* optional API */ }
      }
      session.metadata = null
      session.playbackState = 'none'
    }
  }, [playAudio, pauseAudio, goPrev, goNext])
  useEffect(() => {
    if (!navigator.mediaSession || typeof MediaMetadata === 'undefined') return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: t('JuniorMark • Mặt trời & Mặt trăng', 'JuniorMark • Sun & Moon'),
      artwork: [{ src: new URL(track.artwork, window.location.href).href, type: 'image/jpeg' }],
    })
  }, [track, language])
  useEffect(() => {
    if (navigator.mediaSession) navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [isPlaying])

  /* ── Lời bài hát đồng bộ ── */
  const activeLine = useMemo(() => {
    let idx = -1
    for (let i = 0; i < track.lyrics.length; i++) { if (track.lyrics[i].time <= currentTime + 0.15) idx = i; else break }
    return idx
  }, [track, currentTime])
  useEffect(() => {
    // Tự cuộn riêng trong khung lời (không dùng scrollIntoView để khỏi cuộn cả trang).
    const box = lyricsRef.current
    if (activeTab !== 'lyrics' || !box || activeLine < 0) return
    const line = box.children[activeLine]
    if (!line) return
    box.scrollTo({ top: line.offsetTop - box.clientHeight / 2 + line.clientHeight / 2, behavior: reducedMotion.current ? 'auto' : 'smooth' })
  }, [activeLine, activeTab, selected])

  function seek(event) { seekTo(Number(event.target.value)) }
  function changeVolume(event) {
    const value = Number(event.target.value)
    audio.current.volume = value
    audio.current.muted = false
    setVolume(value)
    setMuted(false)
  }

  /* ───────────── Các mảnh UI ───────────── */
  function progress(prefix) {
    return <div className="scrubber">
      <label className="sr-only" htmlFor={`${prefix}-progress`}>{t("Vị trí phát nhạc", "Playback position")}</label>
      <input id={`${prefix}-progress`} type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 0)} disabled={!duration} onChange={seek} />
      <div><span>{formatTime(currentTime)}</span><span className="vp-now"><Visualizer active={isPlaying} />{t("ĐANG PHÁT", "NOW PLAYING")}</span><span>{formatTime(duration)}</span></div>
    </div>
  }
  // extended = true: thêm Shuffle + Loop hai bên (hero). Mini player chỉ dùng 3 nút cơ bản.
  function controls(extended) {
    return <div className="player-controls">
      {extended && <button className={`round-button small vp-toggle ${shuffle ? 'is-on' : ''}`} aria-pressed={shuffle}
                           aria-label={shuffle ? t("Tắt phát ngẫu nhiên", "Turn shuffle off") : t("Bật phát ngẫu nhiên", "Turn shuffle on")}
                           onClick={() => setShuffle(v => !v)}><Shuffle size={17} /></button>}
      <button className="round-button" aria-label={t("Bản trước", "Previous track")} onClick={goPrev}><SkipBack size={19} /></button>
      <button className="round-button play-button" aria-label={isPlaying ? t('Tạm dừng', 'Pause') : t('Phát nhạc', 'Play music')} onClick={togglePlay}>{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button>
      <button className="round-button" aria-label={t("Bản tiếp theo", "Next track")} onClick={goNext}><SkipForward size={19} /></button>
      {extended && <button className={`round-button small vp-toggle ${loopMode !== 'off' ? 'is-on' : ''}`} aria-pressed={loopMode !== 'off'}
                           aria-label={loopMode === 'off' ? t("Lặp lại: tắt", "Repeat: off") : loopMode === 'all' ? t("Lặp lại: cả danh sách", "Repeat: all") : t("Lặp lại: một bài", "Repeat: one")}
                           onClick={() => setLoopMode(m => NEXT_LOOP[m])}>{loopMode === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}</button>}
    </div>
  }
  function volumeControl(prefix) {
    return <div className="music-volume">
      <button className="round-button small" aria-label={muted ? t('Bật âm thanh', 'Unmute') : t('Tắt âm thanh', 'Mute')} aria-pressed={muted} onClick={() => { audio.current.muted = !muted; setMuted(!muted) }}>{muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
      <label className="sr-only" htmlFor={`${prefix}-volume`}>{t("Âm lượng", "Volume")}</label>
      <input id={`${prefix}-volume`} type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={changeVolume} />
    </div>
  }
  const heartButton =
      <button className={`round-button small vp-heart ${isLiked ? 'is-on' : ''}`} aria-pressed={isLiked}
              aria-label={isLiked ? t("Bỏ yêu thích", "Remove from favorites") : t("Yêu thích", "Add to favorites")} onClick={toggleLike}>
        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        {isLiked && burst > 0 && <span className="vp-burst" key={burst} aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map(i => <i key={i} style={{ '--a': `${i * 60}deg` }}>♥</i>)}
      </span>}
      </button>

  const hero =
      <section ref={card} className="record-console panel" id={heroTarget === undefined ? 'record-player' : undefined} aria-label={t("Góc âm nhạc", "Music corner")}>
        <div className="turntable">
          <div className="album-sleeve"><img src="/images/fan-photos/HNwNJ4GbsAE5PwW.jpg" alt={t("JuniorMark trên bìa đĩa", "JuniorMark on the record sleeve")} loading="lazy" /></div>

          {/* Đĩa: wrap tĩnh (hình vuông → luôn tròn) chứa đĩa quay + lớp phản quang đứng yên + kim */}
          <div ref={wrapRef} className={`vp-vinyl ${spinning ? 'is-spinning' : ''} ${isScratching ? 'is-scratching' : ''}`} aria-hidden="true"
               onPointerDown={onDiscDown} onPointerMove={onDiscMove} onPointerUp={onDiscUp} onPointerCancel={onDiscUp}>
            <span className="vp-glow" /><span className="vp-halo" />
            <div ref={discRef} className="vp-disc">
              <span className="vp-galaxy" /><span className="vp-mark" />
              <div className="vp-label">
                <span className="vp-label-side">{t("MẶT A • 33 VÒNG/PHÚT", "SIDE A • 33 RPM")}</span>
                <strong>JuniorMark</strong>
                <small>{t("MẶT TRỜI & MẶT TRĂNG", "SUN & MOON")}</small>
                <i className="vp-label-dot" />
              </div>
            </div>
            <span className="vp-stardust">{STARS.map((d, i) => <b key={i} style={{ '--a': `${d.a}deg`, '--s': `${d.s}px` }}><i /></b>)}</span>
            <span className="vp-sheen" />
            <div className={`vp-tonearm ${isPlaying ? 'is-down' : ''} ${spinning ? 'is-tracking' : ''}`}><i className="vp-needle" /></div>
          </div>

          <div className="turntable-meta"><span>{t("● TRÁI TIM MỘC • TÂM HỒN SỐ", "● ANALOG HEART • DIGITAL SOUL")}</span><span>{t("PHIÊN BẢN MẶT TRỜI & MẶT TRĂNG", "SUN & MOON SPECIAL")}</span></div>
        </div>

        <div className="player-details">
          <span className="eyebrow">{t('BẢN NHẠC TINH TÚ #', 'CONSTELLATION TRACK #')}{String(selected + 1).padStart(2, '0')}</span>
          <h2>{track.title}</h2><p className="muted">{track.artist}</p>
          {progress('hero')}

          {/* Cụm điều khiển gọn: [transport] ... [tim + âm lượng] trên cùng một hàng, tự xuống dòng ở màn hẹp */}
          <div className="vp-actions">
            {controls(true)}
            <div className="vp-extras">{heartButton}{volumeControl('hero')}</div>
          </div>
          <p className="player-note" role="status">{error ? t('Không thể phát âm thanh. Vui lòng bấm Phát nhạc để thử lại.', 'Unable to play audio. Please press Play to try again.') : t('Giai điệu dành cho những khoảnh khắc của chúng mình.', 'Melodies for the moments we share.')}</p>

          <div className="vp-tabs" role="tablist" aria-label={t("Chế độ hiển thị", "View mode")}>
            {[['playlist', t("Danh sách phát", "Playlist")], ['lyrics', t("Lời bài hát", "Lyrics")]].map(([id, label]) =>
                <button key={id} role="tab" id={`vp-tab-${id}`} aria-selected={activeTab === id} aria-controls="vp-panel" className={activeTab === id ? 'is-selected' : ''} onClick={() => setActiveTab(id)}>{label}</button>)}
          </div>

          <div className="vp-panel" id="vp-panel" role="tabpanel" aria-labelledby={`vp-tab-${activeTab}`}>
            {activeTab === 'playlist'
                ? <div className="tracklist music-tracklist">{tracks.map((item, index) => <div className="music-track" key={item.title}>
                  <button aria-pressed={index === selected} className={index === selected ? 'selected' : ''} onClick={() => selectTrack(index)}><span>♫ {String(index + 1).padStart(2, '0')}. {item.title}<small>{item.artist}</small></span><span>♫</span></button>
                  <a href={item.spotifyUrl} target="_blank" rel="noreferrer" aria-label={t(`Tìm ${item.title} trên Spotify`, `Find ${item.title} on Spotify`)}>Spotify ↗</a>
                </div>)}</div>
                : track.lyrics.length
                    ? <div className="vp-lyrics" ref={lyricsRef}>{track.lyrics.map((line, i) =>
                        <button key={i} className={`vp-lyric ${i === activeLine ? 'is-active' : i < activeLine ? 'is-past' : ''}`} aria-current={i === activeLine ? 'true' : undefined} onClick={() => seekTo(line.time)}>{line.text}</button>)}</div>
                    : <p className="muted vp-empty">{t("Bản nhạc này chưa có lời đồng bộ.", "No synced lyrics for this track yet.")}</p>}
          </div>
        </div>
      </section>

  return <>
    {heroTarget === undefined ? hero : heroTarget ? createPortal(hero, heroTarget) : null}
    <audio ref={audio} src={tracks[0].audioSrc} preload="auto"
           onPlaying={() => { wantsPlay.current = true; setIsPlaying(true) }}
           onPause={() => {
             // Bỏ qua pause cũ còn trong hàng đợi nếu nguồn mới đang phát.
             if (!audio.current.paused) return
             wantsPlay.current = false
             setIsPlaying(false)
           }} onWaiting={() => setIsPlaying(false)}
           onEnded={handleEnded}
           onTimeUpdate={() => { if (!dragging.current) setCurrentTime(audio.current.currentTime) }}
           onDurationChange={() => setDuration(Number.isFinite(audio.current.duration) ? audio.current.duration : 0)}
           onLoadedMetadata={() => setDuration(Number.isFinite(audio.current.duration) ? audio.current.duration : 0)}
           onError={() => { wantsPlay.current = false; setIsPlaying(false); setError('playback-error') }} />
    {showMini && createPortal(<><section className="music-mini" aria-label={t("Trình phát thu nhỏ", "Mini player")}>
      <div className="music-mini-info"><img src="/images/fan-photos/HNwNJ4GbsAE5PwW.jpg" alt="" /><div><strong>{track.title}</strong><small>{track.artist}</small><span>{error ? t('Không thể phát âm thanh. Vui lòng thử lại.', 'Unable to play audio. Please try again.') : (isPlaying ? t('Đang phát', 'Playing') : t('Sẵn sàng phát', 'Ready to play'))}</span></div></div>
      <div className="music-mini-playback">{controls(false)}{progress('mini')}</div>
      {volumeControl('mini')}
    </section><div className="music-mini-spacer" aria-hidden="true" /></>, document.body)}
  </>
}