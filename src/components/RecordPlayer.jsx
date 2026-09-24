import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './RecordPlayer.css'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle } from 'lucide-react'

const duet = 'Junior Panachai, Mark Jiruntanin'
const tracks = [
  { title: 'อย่าน่ารักเกิน (Cutie Overload)', artist: duet,
    audioSrc: '/audio/ytmp3free.cc_cutie-overload-junior-panachai-mark-jiruntanin-youtubemp3free.org.mp3' },
  { title: 'วางใจ (Trust Me)', artist: duet,
    audioSrc: '/audio/ytmp3free.cc_trust-me-ostmy-romance-scammer-junior-panachai-mark-jiruntanin-youtubemp3free.org.mp3' },
  { title: 'ให้ได้รัก (Let Me Love You)', artist: 'Junior Panachai',
    audioSrc: '/audio/ytmp3free.cc_let-me-love-you-ostmy-romance-scammer-junior-panachai-youtubemp3free.org.mp3' },
  { title: 'No One Else', artist: 'Perth Tanapon, Santa Pongsapak',
    audioSrc: '/audio/ytmp3free.cc_no-one-else-ost-perfect-10-liners-perth-tanapon-santa-pongsapak-youtubemp3free.org.mp3' },
].map((track) => ({ ...track,
  album: 'JuniorMark • Sun & Moon',
  artwork: '/images/fan-photos/HNwNJ4GbsAE5PwW.jpg',
  spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(`${track.title} ${track.artist}`)}`,
}))
const formatTime = (value) => Number.isFinite(value) ? `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.floor(value % 60).toString().padStart(2, '0')}` : '--:--'

// App owns this instance. Only the hero UI is portaled into the Studio route.
// An omitted target also supports rendering the player on its own.
export default function RecordPlayer({ heroTarget } = {}) {
  const [selected, setSelected] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const [showMini, setShowMini] = useState(false)
  const audio = useRef(null)
  const card = useRef(null)
  const active = useRef(0)
  const request = useRef(0)
  const wantsPlay = useRef(false)
  const track = tracks[selected]

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

  const playAudio = useCallback(async () => {
    const token = ++request.current
    wantsPlay.current = true
    setError('')
    try { await audio.current.play() }
    catch {
      if (token !== request.current) return
      wantsPlay.current = false
      setPlaying(false)
      setError('Không thể phát âm thanh. Vui lòng bấm Play để thử lại.')
    }
  }, [])
  const pauseAudio = useCallback(() => {
    request.current++
    wantsPlay.current = false
    audio.current.pause()
    setPlaying(false)
  }, [])
  const selectTrack = useCallback((index) => {
    request.current++
    audio.current.pause()
    active.current = (index + tracks.length) % tracks.length
    setSelected(active.current)
    setPlaying(false)
    setElapsed(0)
    setDuration(0)
    // Set source and play inside the user gesture for mobile browsers.
    audio.current.src = tracks[active.current].audioSrc
    audio.current.load()
    void playAudio()
  }, [playAudio])
  function togglePlay() {
    if (wantsPlay.current) {
      pauseAudio()
    } else void playAudio()
  }
  useEffect(() => {
    const session = navigator.mediaSession
    if (!session || typeof session.setActionHandler !== 'function') return
    const handlers = {
      play: () => { void playAudio() },
      pause: pauseAudio,
      previoustrack: () => selectTrack(active.current - 1),
      nexttrack: () => selectTrack(active.current + 1),
    }
    const registered = []
    for (const [action, handler] of Object.entries(handlers)) {
      // Browsers may expose Media Session but only support some actions.
      try { session.setActionHandler(action, handler); registered.push(action) } catch { /* optional API */ }
    }
    return () => {
      for (const action of registered) {
        try { session.setActionHandler(action, null) } catch { /* optional API */ }
      }
      session.metadata = null
      session.playbackState = 'none'
    }
  }, [playAudio, pauseAudio, selectTrack])

  useEffect(() => {
    if (!navigator.mediaSession || typeof MediaMetadata === 'undefined') return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [{ src: new URL(track.artwork, window.location.href).href, type: 'image/jpeg' }],
    })
  }, [track])

  useEffect(() => {
    if (navigator.mediaSession) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
  }, [playing])

  function seek(event) {
    const time = Math.min(duration, Math.max(0, Number(event.target.value)))
    audio.current.currentTime = time
    setElapsed(time)
  }
  function changeVolume(event) {
    const value = Number(event.target.value)
    audio.current.volume = value
    audio.current.muted = false
    setVolume(value)
    setMuted(false)
  }
  function progress(prefix) {
    return <div className="scrubber">
      <label className="sr-only" htmlFor={`${prefix}-progress`}>Vị trí phát nhạc</label>
      <input id={`${prefix}-progress`} type="range" min="0" max={duration || 1} step="0.1" value={Math.min(elapsed, duration || 0)} disabled={!duration} onChange={seek} />
      <div><span>{formatTime(elapsed)}</span><span>♫ NOW PLAYING</span><span>{formatTime(duration)}</span></div>
    </div>
  }
  function controls() {
    return <div className="player-controls">
      <button className="round-button" aria-label="Bản trước" onClick={() => selectTrack(active.current - 1)}><SkipBack size={19} /></button>
      <button className="round-button play-button" aria-label={playing ? 'Tạm dừng' : 'Phát nhạc'} onClick={togglePlay}>{playing ? <Pause size={24} /> : <Play size={24} />}</button>
      <button className="round-button" aria-label="Bản tiếp theo" onClick={() => selectTrack(active.current + 1)}><SkipForward size={19} /></button>
    </div>
  }
  function volumeControl(prefix) {
    return <div className="music-volume">
      <button className="round-button small" aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} aria-pressed={muted} onClick={() => { audio.current.muted = !muted; setMuted(!muted) }}>{muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
      <label className="sr-only" htmlFor={`${prefix}-volume`}>Âm lượng</label>
      <input id={`${prefix}-volume`} type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={changeVolume} />
    </div>
  }
  const hero =
    <section ref={card} className="record-console panel" id={heroTarget === undefined ? 'record-player' : undefined} aria-label="Góc âm nhạc">
      <div className="turntable">
        <div className="album-sleeve"><img src="/images/fan-photos/HNwNJ4GbsAE5PwW.jpg" alt="JuniorMark trên bìa đĩa" loading="lazy" /></div>
        <div className={`vinyl ${playing ? 'playing' : ''}`} aria-hidden="true"><div className="vinyl-label"><span>SIDE A • 33 RPM</span><strong>JuniorMark</strong><small>SUN & MOON</small><i /></div></div>
        <div className={`tonearm ${playing ? 'playing' : ''}`} aria-hidden="true"><i /></div>
        <div className="turntable-meta"><span>● ANALOG HEART • DIGITAL SOUL</span><span>SUN & MOON SPECIAL</span></div>
      </div>
      <div className="player-details">
        <span className="eyebrow">CONSTELLATION TRACK #{String(selected + 1).padStart(2, '0')}</span>
        <h2>{track.title}</h2><p className="muted">{track.artist}</p>
        {progress('hero')}
        <div className="music-actions">{controls()}<button className="round-button small" aria-label="Chọn bản ngẫu nhiên" onClick={() => selectTrack(active.current + 1 + Math.floor(Math.random() * (tracks.length - 1)))}><Shuffle size={18} /></button>{volumeControl('hero')}</div>
        <p className="player-note" role="status">{error || 'Giai điệu dành cho những khoảnh khắc của chúng mình.'}</p>
        <span className="eyebrow tracklist-title">CELESTIAL TAPE DECK TRACKLIST</span>
        <div className="tracklist music-tracklist">{tracks.map((item, index) => <div className="music-track" key={item.title}>
          <button aria-pressed={index === selected} className={index === selected ? 'selected' : ''} onClick={() => selectTrack(index)}><span>♫ {String(index + 1).padStart(2, '0')}. {item.title}<small>{item.artist}</small></span><span>♫</span></button>
          <a href={item.spotifyUrl} target="_blank" rel="noreferrer" aria-label={`Tìm ${item.title} trên Spotify`}>Spotify ↗</a>
        </div>)}</div>
      </div>
    </section>

  return <>
    {heroTarget === undefined ? hero : heroTarget ? createPortal(hero, heroTarget) : null}
    <audio ref={audio} src={tracks[0].audioSrc} preload="auto"
        onPlaying={() => { wantsPlay.current = true; setPlaying(true) }}
        onPause={() => {
          // Ignore an old queued pause if a new source is already playing.
          if (!audio.current.paused) return
          wantsPlay.current = false
          setPlaying(false)
        }} onWaiting={() => setPlaying(false)}
        onEnded={() => selectTrack(active.current + 1)}
        onTimeUpdate={() => setElapsed(audio.current.currentTime)}
        onDurationChange={() => setDuration(Number.isFinite(audio.current.duration) ? audio.current.duration : 0)}
        onLoadedMetadata={() => setDuration(Number.isFinite(audio.current.duration) ? audio.current.duration : 0)}
        onError={() => { wantsPlay.current = false; setPlaying(false); setError('Không thể phát âm thanh. Vui lòng bấm Play để thử lại.') }} />
    {showMini && createPortal(<><section className="music-mini" aria-label="Trình phát thu nhỏ">
      <div className="music-mini-info"><img src="/images/fan-photos/HNwNJ4GbsAE5PwW.jpg" alt="" /><div><strong>{track.title}</strong><small>{track.artist}</small><span>{error || (playing ? 'Đang phát' : 'Sẵn sàng phát')}</span></div></div>
      <div className="music-mini-playback">{controls()}{progress('mini')}</div>
      {volumeControl('mini')}
    </section><div className="music-mini-spacer" aria-hidden="true" /></>, document.body)}
  </>
}
