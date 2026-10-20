import { useEffect, useRef, useState } from 'react'
import { Bath, BedDouble, BookOpen, Camera, Heart, LibraryBig, Moon, Music2, NotebookPen, Sparkles, Sun, ZoomIn, ZoomOut } from 'lucide-react'
import Dialog from '../components/Dialog'
import { catalog } from '../data/catalog'
import { t as tr, useLanguage, localize } from '../i18n/language'
import useRoomActivity from '../features/jummo/useRoomActivity'
import DiaryDialog from '../features/jummo/DiaryDialog'
import CarePanel from '../features/jummo/CarePanel'
import DiningRoom from '../features/jummo/DiningRoom'
import BathRoom from '../features/jummo/BathRoom'
import { useCareState } from '../features/jummo/careState'
import { ACTIVITY_ART, HOTSPOTS, JUMMO_ART, ROOM_ART, SPRITE_CROP, SPRITE_WIDTH } from '../features/jummo/roomScene'
import './JummoRoom.css'

const environments = [
  { time: 'day', rain: false }, { time: 'evening', rain: false },
  { time: 'night', rain: false }, { time: 'day', rain: true },
  { time: 'evening', rain: true }, { time: 'night', rain: true },
]

export default function JummoRoom({ openAuth, onBusyChange = () => {} }) {
  useLanguage()
  const room = useRoomActivity()
  const care = useCareState(room.activity)
  const [dining, setDining] = useState(false)
  const [bathing, setBathing] = useState(false)
  const [roomHint, setRoomHint] = useState('')
  const [environmentIndex, setEnvironmentIndex] = useState(0)
  const [overlay, setOverlay] = useState(null)
  const [taps, setTaps] = useState(0)
  const [snapshot, setSnapshot] = useState('')
  const [photoError, setPhotoError] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  useEffect(() => {
    function pause() {
      if (document.hidden) setOverlay((active) => ACTIVITY_ART[active] ? null : active)
    }
    document.addEventListener('visibilitychange', pause)
    return () => document.removeEventListener('visibilitychange', pause)
  }, [])
  const roomImage = useRef(null)
  const jummoImage = useRef(null)
  const environment = environments[environmentIndex]
  const timeLabel = environment.time === 'day' ? tr('Ngày', 'Day') : environment.time === 'evening' ? tr('Chiều', 'Evening') : tr('Đêm', 'Night')
  const windowLabel = tr(`Cửa sổ: ${timeLabel}, ${environment.rain ? 'có mưa' : 'trời quang'}`, `Window: ${timeLabel}, ${environment.rain ? 'rainy' : 'clear'}`)
  const isSleeping = room.activity === 'sleeping'
  const isMusic = ['listening', 'dancing'].includes(room.activity)
  const labels = {
    idle: tr('Jummo đang chờ bạn chơi cùng', 'Jummo is ready to play'),
    moving: tr('Jummo đang đi tới giường…', 'Jummo is walking to bed…'),
    sleeping: tr('Suỵt… Jummo đang ngủ ngon', 'Shh… Jummo is sleeping soundly'),
    returning: tr('Jummo thức rồi! Đang quay lại…', 'Jummo is awake! Walking back…'),
    listening: tr('Jummo đang nghe nhạc', 'Jummo listening'),
    dancing: tr('Jummo đang nhảy múa', 'Jummo dancing'),
    reading: tr('Jummo đang đọc sách', 'Jummo reading'),
    stargazing: tr('Jummo đang ngắm sao', 'Jummo stargazing'),
  }
  const spriteLabel = isSleeping ? tr('Jummo đang ngủ', 'Jummo sleeping') : room.activity === 'idle' ? 'Jummo' : labels[room.activity]
  const moods = catalog.editorial_entries.filter((entry) => entry.section === 'mood')
  const book = moods.find((entry) => entry.id === 'book') || moods[0]
  const letter = catalog.editorial_entries.find((entry) => entry.section === 'letter')

  function enterDining() {
    if (room.occupied) {
      setRoomHint(room.travelling ? tr('Chờ Jummo di chuyển xong nhé.', 'Wait for Jummo to finish walking.') : tr('Đánh thức Jummo trước khi vào phòng ăn nhé.', 'Wake Jummo before entering the dining room.'))
      return
    }
    room.perform('idle'); setOverlay(null); setSnapshot(''); setRoomHint(''); setDining(true)
  }

  function openBook() {
    if (room.occupied) return
    room.perform('reading')
    setOverlay('reading')
  }
  function closeOverlay() {
    setOverlay(null)
    if (['reading', 'dancing', 'listening', 'stargazing'].includes(room.activity)) room.perform('idle')
  }
  function stargaze() {
    if (room.occupied) return
    room.perform('stargazing')
    setOverlay('stargazing')
  }
  function toggleRadio() {
    if (room.occupied) return
    room.perform('dancing')
    setOverlay('dancing')
  }
  function goToBed() {
    if (room.occupied) return
    room.sleep()
    setOverlay('sleeping')
  }
  function tapJummo() {
    if (room.occupied) return
    const next = Math.min(5, taps + 1)
    setTaps(next)
    if (next === 5) setOverlay('letter')
  }

  function captureSnapshot() {
    if (room.travelling) return
    setPhotoError(false)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1678
      canvas.height = 937
      const context = canvas.getContext('2d')
      if (!context || !roomImage.current?.naturalWidth || !jummoImage.current?.naturalWidth) throw new Error('Image not ready')
      context.drawImage(roomImage.current, 0, 0, canvas.width, canvas.height)
      if (environment.time !== 'day') {
        context.fillStyle = environment.time === 'night' ? 'rgba(28, 18, 73, .28)' : 'rgba(237, 155, 130, .12)'
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
      if (environment.rain) {
        context.strokeStyle = 'rgba(225, 225, 255, .6)'
        context.lineWidth = 2
        for (let x = 1305; x < 1490; x += 17) {
          for (let y = 280; y < 435; y += 30) {
            context.beginPath(); context.moveTo(x, y); context.lineTo(x - 5, y + 16); context.stroke()
          }
        }
      }
      const width = canvas.width * SPRITE_WIDTH / 100
      const height = width * SPRITE_CROP.height / SPRITE_CROP.width
      context.save()
      context.translate(room.position.x * canvas.width / 100, room.position.y * canvas.height / 100 - height / 2)
      if (isSleeping) context.rotate(-Math.PI / 3)
      context.drawImage(jummoImage.current, SPRITE_CROP.x, SPRITE_CROP.y, SPRITE_CROP.width, SPRITE_CROP.height, -width / 2, -height / 2, width, height)
      context.restore()
      if (isSleeping) {
        context.fillStyle = '#5d4a86'; context.font = 'bold 28px sans-serif'
        context.fillText('Z z z', canvas.width * .3, canvas.height * .48)
      }
      setSnapshot(canvas.toDataURL('image/png'))
    } catch { setPhotoError(true) }
  }

  return (
    <section className="jummo-room" role="region" aria-label={tr('Phòng của Jummo', "Jummo's Room")} data-time={environment.time} data-rain={String(environment.rain)} data-activity={room.activity}>
      <header className="jr-heading">
        <div>
          <span className="jr-eyebrow"><Sparkles size={14} /> {tr('MỘT GÓC NHỎ CỦA CHÚNG MÌNH', 'OUR LITTLE HAPPY PLACE')}</span>
          <h1>Jummo’s Room<span aria-hidden="true"> ✧</span></h1>
          <p>{tr('Ghé chơi, chạm một món đồ và ở bên Jummo một chút.', 'Come in, tap something, and spend a little time with Jummo.')}</p>
        </div>
        <span className="jr-home-badge"><span /> {tr('Jummo đang ở nhà', 'Jummo is home')}</span>
      </header>
      {care.saveError && <p role="alert">{tr('Chưa lưu được tiến trình trên trình duyệt này. Hãy kiểm tra quyền lưu trữ.', 'Progress could not be saved in this browser. Check storage permissions.')}</p>}
      {bathing ? <BathRoom stats={care.stats} completeBath={care.completeBath} onBack={() => setBathing(false)} /> : dining ? <DiningRoom stats={care.stats} completeMeal={care.completeMeal} onBusyChange={onBusyChange} onBack={() => setDining(false)} /> : <>
      <div className="jr-room-card">
        <div className="jr-scene-toolbar">
          <span><Moon size={16} /> {tr('Góc phòng lavender', 'The lavender corner')}</span>
          <div>
            <span className="jr-weather">{timeLabel}{environment.rain ? ` · ${tr('Mưa', 'Rain')}` : ''}</span>
            <button type="button" className="jr-icon-button" aria-label={zoomed ? tr('Thu nhỏ phòng', 'Zoom out') : tr('Phóng to phòng', 'Zoom in')} aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}</button>
          </div>
        </div>
        <div className="jr-care-scene">
        <CarePanel stats={care.stats} />
        <div className={`jr-scene-scroll${zoomed ? ' is-zoomed' : ''}`} tabIndex={zoomed ? 0 : undefined} role="group" aria-label={tr('Khung cảnh phòng', 'Room scene')}>
          <div className={`jr-scene scene-${environment.time}`}>
            <img ref={roomImage} className="jr-room-art" src={ROOM_ART} alt={tr('Căn phòng tím với giường bên trái, bàn nhạc và cửa sổ bên phải', 'A lavender bedroom with a bed on the left, a record player and a window on the right')} draggable="false" />
            <div className="jr-lighting" aria-hidden="true" />
            {environment.rain && <div className="jr-window-rain" aria-hidden="true" />}
            <button type="button" className={`jr-hotspot jr-bed${isSleeping ? ' is-active' : ''}`} style={HOTSPOTS.bed} aria-label={tr('Giường', 'Bed')} disabled={room.occupied} onClick={goToBed}>
              <span className="jr-object-label"><BedDouble size={15} /> {tr('Ngủ một chút', 'Take a nap')}<span aria-hidden="true"> ↗</span></span>
            </button>
            <button type="button" className="jr-hotspot jr-window" style={HOTSPOTS.window} aria-label={windowLabel} onClick={() => setEnvironmentIndex((index) => (index + 1) % environments.length)}>
              <span className="jr-object-label"><Sun size={15} /> {tr('Cửa sổ', 'Window')}</span>
            </button>
            <button type="button" className={`jr-hotspot jr-radio${isMusic ? ' is-active' : ''}`} style={HOTSPOTS.radio} aria-label={tr('Đài radio', 'Radio')} disabled={room.occupied} onClick={toggleRadio}>
              <span className="jr-object-label"><Music2 size={15} /> {tr('Nhạc', 'Music')}</span>
            </button>
            <button type="button" className="jr-hotspot jr-bookshelf" style={HOTSPOTS.bookshelf} aria-label={tr('Kệ sách', 'Bookshelf')} disabled={room.occupied} onClick={() => setOverlay('bookshelf')}>
              <span className="jr-object-label"><LibraryBig size={15} /> {tr('Sách', 'Books')}</span>
            </button>
            <div className={`jr-character activity-${room.activity}`} data-facing={room.facing} style={{ left: `${room.position.x}%`, top: `${room.position.y}%`, '--travel-time': `${room.duration}ms`, '--sprite-width': `${SPRITE_WIDTH}%` }}>
              <span className="jr-character-shadow" aria-hidden="true" />
              <button type="button" className="jr-character-button" aria-label="Jummo" disabled={room.occupied} onClick={tapJummo}>
                <span className="jr-sprite-crop"><img ref={jummoImage} src={JUMMO_ART} alt={spriteLabel} draggable="false" /></span>
              </button>
              {isSleeping && <span className="jr-sleep-bubble" aria-hidden="true">Z<span>z</span><small>z</small></span>}
              {isMusic && <span className="jr-notes" aria-hidden="true">♪ ♫</span>}
              {room.activity === 'reading' && <BookOpen className="jr-reading-book" aria-hidden="true" />}
            </div>
          </div>
        </div>
        </div>
        <div className="jr-status-bar">
            <strong role="status" aria-live="polite">{labels[room.activity]}</strong>
        </div>
      </div>
      <nav className="jr-actions" aria-label={tr('Hoạt động trong phòng', 'Room activities')}>
        <button type="button" aria-label={tr('Ăn uống', 'Dining room')} onClick={enterDining}><Heart size={19} /> {tr('Ăn uống', 'Dining')}</button>
        <button type="button" disabled={room.occupied} onClick={() => { room.perform('idle'); setOverlay(null); setSnapshot(''); setBathing(true) }}><Bath size={19} /> {tr('Tắm', 'Bath')}</button>
        <button type="button" disabled={room.travelling} onClick={isSleeping ? room.wake : goToBed}>{isSleeping ? <Sun size={19} /> : <BedDouble size={19} />}{isSleeping ? tr('Đánh thức', 'Wake up') : room.travelling ? tr('Đang đi…', 'Walking…') : tr('Ngủ', 'Go to bed')}</button>
        <button type="button" disabled={room.occupied} onClick={toggleRadio}><Music2 size={19} /> {tr('Nghe nhạc', 'Music time')}</button>
        <button type="button" disabled={room.occupied} aria-label={tr('Đọc sách', 'Book')} onClick={openBook}><BookOpen size={19} /> {tr('Đọc sách', 'Read')}</button>
        <button type="button" disabled={room.occupied} onClick={stargaze}><Sparkles size={19} /> {tr('Ngắm sao', 'Stargaze')}</button>
        <button type="button" aria-label={tr('Nhật ký', 'Diary')} onClick={() => setOverlay('diary')}><NotebookPen size={19} /> {tr('Nhật ký', 'Diary')}</button>
        <button type="button" disabled={room.travelling} aria-label={tr('Chụp ảnh', 'Camera')} onClick={captureSnapshot}><Camera size={19} /> {tr('Chụp ảnh', 'Photo')}</button>
      </nav>
      {roomHint && <p className="jr-room-hint" role="alert">{roomHint}</p>}
      <p className="jr-footnote"><Sparkles size={14} /> {zoomed ? tr('Vuốt ngang để khám phá căn phòng đã phóng to.', 'Swipe sideways to explore the enlarged room.') : tr('Chạm Jummo 5 lần để mở một lời nhắn bí mật.', 'Tap Jummo 5 times for a secret little message.')} <span>{taps}/5</span></p>
      {photoError && <p className="jr-photo-error" role="alert">{tr('Ảnh chưa sẵn sàng. Chờ phòng tải xong rồi chụp lại nhé.', 'The picture is not ready. Let the room finish loading, then try again.')}</p>}
      {snapshot && <Dialog title={tr('Một khoảnh khắc cùng Jummo', 'A moment with Jummo')} onClose={() => setSnapshot('')} className="jr-dialog">
        <img className="jr-snapshot" src={snapshot} alt={tr('Ảnh chụp phòng', 'Room snapshot')} />
        <a className="jr-primary-button" href={snapshot} download="jummos-room.png">{tr('Lưu ảnh', 'Save snapshot')}</a>
      </Dialog>}
      {overlay === 'diary' && <DiaryDialog onClose={closeOverlay} openAuth={openAuth} />}
      {ACTIVITY_ART[overlay] && <Dialog title={overlay === 'stargazing' ? tr('Ngắm sao cùng Jummo', 'Stargaze with Jummo') : overlay === 'reading' ? tr('Đọc sách cùng Jummo', 'Read with Jummo') : overlay === 'dancing' ? tr('Nhảy múa cùng Jummo', 'Dance with Jummo') : tr('Chúc Jummo ngủ ngon', 'Sweet dreams, Jummo')} onClose={closeOverlay} className="jr-dialog jr-animation-dialog">
        <img className="jr-activity-gif" src={ACTIVITY_ART[overlay]} alt={overlay === 'stargazing' ? tr('Jummo đang ngắm sao', 'Jummo stargazing') : overlay === 'reading' ? tr('Jummo đang đọc sách', 'Jummo reading') : overlay === 'dancing' ? tr('Jummo đang nhảy múa', 'Jummo dancing') : tr('Jummo đang ngủ', 'Jummo sleeping')} />
      </Dialog>}
      {['bookshelf', 'letter'].includes(overlay) && <Dialog title={overlay === 'bookshelf' ? tr('Kệ sách của Jummo', 'Jummo’s bookshelf') : tr('Thư bí mật', 'Secret letter')} onClose={closeOverlay} className="jr-dialog">
        <span className="jr-eyebrow">{tr('MỘT GÓC NHỎ CỦA JUMMO', 'A LITTLE CORNER OF JUMMO')}</span>
        {overlay === 'bookshelf' ? book ? <button className="jr-book-choice" type="button" aria-label={localize(book.title)} onClick={openBook}><BookOpen /><span><b>{localize(book.title)}</b><small>{localize(book.subtitle || book.body)}</small></span></button> : <p>{tr('Kệ sách đang chờ thêm câu chuyện.', 'The bookshelf is waiting for more stories.')}</p> : <><h3>{localize((overlay === 'letter' ? letter : book)?.title || '')}</h3><p className="jr-letter">{localize((overlay === 'letter' ? letter : book)?.body || '')}</p></>}
      </Dialog>}
      </>}
    </section>
  )
}
