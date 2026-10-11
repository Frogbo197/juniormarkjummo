import { useMemo, useRef, useState } from 'react'
import { BedDouble, BookOpen, Camera, LibraryBig, Music2, NotebookPen, X } from 'lucide-react'
import { catalog } from '../data/catalog'
import { t as tr, useLanguage, localize } from '../i18n/language'
import './JummoRoom.css'

const environmentCycle = [
  { time: 'day', rain: false },
  { time: 'evening', rain: false },
  { time: 'night', rain: false },
  { time: 'day', rain: true },
  { time: 'evening', rain: true },
  { time: 'night', rain: true },
]

function makeRainDrops() {
  return Array.from({ length: 18 }, () => {
    const foreground = Math.random() > 0.7
    const duration = foreground ? 4 + Math.random() * 2 : 6 + Math.random() * 4
    const top = -15 + Math.random() * 95
    return {
      '--drop-left': `${Math.random() * 92 + 2}vw`,
      '--start-top': `${top}vh`,
      '--drop-size': `${foreground ? 200 + Math.random() * 40 : 90 + Math.random() * 30}px`,
      '--drop-drift': `${Math.random() * 100 - 30}px`,
      '--drop-rotation': `${Math.random() * 70 - 20}deg`,
      animationDelay: `${Math.random()}s`,
      animationDuration: `${duration}s`,
      opacity: foreground ? 0.9 + Math.random() * 0.1 : 0.2 + Math.random() * 0.4,
    }
  })
}

function RoomOverlay({ title, label, onClose, children }) {
  return (
    <div className="jummo-room-overlay" role="dialog" aria-modal="true" aria-label={label}>
      <div className="jummo-room-paper">
        <button className="jummo-room-close" type="button" aria-label={tr('Đóng', 'Close')} onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
        <p className="jummo-room-kicker">{tr('Một góc nhỏ của Jummo', 'A little corner of Jummo')}</p>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export default function JummoRoom() {
  useLanguage()
  const stateLabels = {
    idle: ['Jummo', '/images/jummo-mascot.png'],
    listening: [tr('Jummo đang nghe nhạc', 'Jummo listening'), '/jummo_dance.gif'],
    dancing: [tr('Jummo đang nhảy múa', 'Jummo dancing'), '/jummo_dance.gif'],
    reading: [tr('Jummo đang đọc sách', 'Jummo reading'), '/jummo_read.gif'],
    sleeping: [tr('Jummo đang ngủ', 'Jummo sleeping'), '/sleep_mc.png'],
  }
  const [environmentIndex, setEnvironmentIndex] = useState(0)
  const [activity, setActivity] = useState('idle')
  const [overlay, setOverlay] = useState(null)
  const [taps, setTaps] = useState(0)
  const [snapshot, setSnapshot] = useState('')
  const jummoImage = useRef(null)
  const environment = environmentCycle[environmentIndex]
  const rainDrops = useMemo(() => (environment.rain ? makeRainDrops() : []), [environment.rain])
  const moods = catalog.editorial_entries.filter((entry) => entry.section === 'mood')
  const book = moods.find((entry) => entry.id === 'book') || moods[0]
  const letter = localize(catalog.editorial_entries.find((entry) => entry.section === 'letter')?.body || '')
  const [activityLabel, activityImage] = stateLabels[activity]

  function openDiary() {
    setActivity('reading')
    setOverlay('diary')
  }

  function openBook() {
    setActivity('reading')
    setOverlay('diary')
  }

  function toggleRadio() {
    setActivity((current) => {
      if (current !== 'listening' && current !== 'dancing') return 'listening'
      return current === 'listening' ? 'dancing' : 'listening'
    })
  }

  function captureSnapshot() {
    const canvas = document.createElement('canvas')
    canvas.width = 960
    canvas.height = 600
    const context = canvas.getContext('2d')
    if (!context) return

    context.fillStyle = environment.time === 'night' ? '#17233b' : environment.time === 'evening' ? '#b66f5c' : '#f3d39a'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = environment.rain ? '#536d83' : environment.time === 'night' ? '#283e60' : '#a5d4d2'
    context.fillRect(595, 58, 270, 215)
    context.fillStyle = '#79583f'
    context.fillRect(0, 470, canvas.width, 130)
    context.fillStyle = '#bc8d5f'
    context.fillRect(40, 335, 205, 135)
    context.fillRect(695, 390, 220, 80)
    if (jummoImage.current?.complete && jummoImage.current.naturalWidth) {
      context.drawImage(jummoImage.current, 355, 185, 250, 285)
    }

    try {
      setSnapshot(canvas.toDataURL('image/png'))
    } catch {
      setSnapshot('')
    }
  }

  function tapJummo() {
    setTaps((count) => Math.min(5, count + 1))
    if (taps >= 4) setOverlay('letter')
  }

  return (
    <div
      className={`jummo-room scene-${environment.time}${environment.rain ? ' is-raining' : ''}`}
      role="region"
      aria-label={tr('Phòng của Jummo', "Jummo's Room")}
      data-time={environment.time}
      data-rain={environment.rain ? 'true' : 'false'}
    >
      <div className="jummo-room-sky" aria-hidden="true" />
      {environment.rain && (
        <div className="jummo-rain" aria-hidden="true">
          {rainDrops.map((style, index) => (
              <img
                key={index}
                src="/images/jummo_rain.png"
                alt=""
                width="135"
                height="135"
                style={style}
              />
          ))}
        </div>
      )}

      <div className="jummo-room-stars" aria-hidden="true">✦　·　✧　·　✦　·　✧</div>
      <div className="jummo-room-wall" aria-hidden="true" />
      <div className="jummo-room-floor" aria-hidden="true" />

      <button
        className="room-object room-window"
        type="button"
        aria-label={tr(
          `Cửa sổ: ${environment.time === 'day' ? 'ban ngày' : environment.time === 'evening' ? 'chiều' : 'ban đêm'}${environment.rain ? ', có mưa' : ', trời quang'}`,
          `Window: ${environment.time[0].toUpperCase()}${environment.time.slice(1)}, ${environment.rain ? 'rainy' : 'clear'}`,
        )}
        onClick={() => setEnvironmentIndex((index) => (index + 1) % environmentCycle.length)}
      >
        <span className="window-sky" aria-hidden="true"><span className="window-sun" /></span>
        <span className="window-label">
          {tr('Cửa sổ', 'Window')} · {tr(environment.time === 'day' ? 'Ngày' : environment.time === 'evening' ? 'Chiều' : 'Đêm', environment.time[0].toUpperCase() + environment.time.slice(1))}
          {environment.rain ? ` · ${tr('Mưa', 'Rain')}` : ''}
        </span>
      </button>

      <div className="room-shelf-decor" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="room-desk" aria-hidden="true" />
      <button className="room-object room-bookshelf" type="button" aria-label={tr('Kệ sách', 'Bookshelf')} onClick={() => setOverlay('bookshelf')}>
        <LibraryBig aria-hidden="true" />
        <span>{tr('Kệ sách', 'Bookshelf')}</span>
      </button>
      <button className="room-object room-radio" type="button" aria-label={tr('Đài radio', 'Radio')} onClick={toggleRadio}>
        <Music2 aria-hidden="true" />
        <span>{tr('Radio', 'Radio')}</span>
        <i className={`radio-light${activity === 'listening' || activity === 'dancing' ? ' on' : ''}`} aria-hidden="true" />
      </button>
      <button className="room-object room-diary" type="button" aria-label={tr('Nhật ký', 'Diary')} onClick={openDiary}>
        <NotebookPen aria-hidden="true" />
        <span>{tr('Nhật ký', 'Diary')}</span>
      </button>
      <button className="room-object room-book" type="button" aria-label={tr('Sách', 'Book')} onClick={openBook}>
        <BookOpen aria-hidden="true" />
        <span>{tr('Sách', 'Book')}</span>
      </button>
      <button className="room-object room-camera" type="button" aria-label={tr('Máy ảnh', 'Camera')} onClick={captureSnapshot}>
        <Camera aria-hidden="true" />
        <span>{tr('Máy ảnh', 'Camera')}</span>
      </button>
      <button className="room-object room-bed" type="button" aria-label={tr('Giường', 'Bed')} onClick={() => setActivity('sleeping')}>
        <BedDouble aria-hidden="true" />
        <span>{tr('Giường', 'Bed')}</span>
      </button>

      <div className={`room-jummo activity-${activity}`}>
        <button className="jummo-sprite-button" type="button" aria-label="Jummo" onClick={tapJummo}>
          <img ref={jummoImage} src={activityImage} alt={activityLabel} />
        </button>
        <span className="jummo-status" aria-live="polite">{activityLabel}</span>
        <span className="jummo-secret-hint">{tr('Chạm Jummo để tìm một điều bí mật', 'Tap Jummo to find a little secret')} · {taps}/5</span>
      </div>

      <div className="room-title">
        <span>{tr('MỘT GÓC NHỎ ẤM ÁP', 'A LITTLE COZY CORNER')}</span>
        <h1>Jummo’s Room</h1>
      </div>

      {snapshot && (
        <div className="room-snapshot" role="status">
          <img src={snapshot} alt={tr('Ảnh chụp phòng', 'Room snapshot')} />
          <a href={snapshot} download="jummos-room.png">{tr('Lưu ảnh', 'Save snapshot')}</a>
          <button type="button" aria-label={tr('Đóng ảnh chụp', 'Close snapshot')} onClick={() => setSnapshot('')}><X size={16} /></button>
        </div>
      )}

      {overlay === 'diary' && (
        <RoomOverlay label={tr('Nhật ký của Jummo', 'Jummo’s diary')} title={localize(book?.title || tr('Nhật ký', 'A quiet page'))} onClose={() => setOverlay(null)}>
          <BookOpen className="room-paper-icon" aria-hidden="true" />
          <p>{localize(book?.body || tr('Một trang sách đang chờ được bổ sung.', 'A quiet page is waiting to be filled.'))}</p>
          <p className="room-paper-note">{localize(book?.subtitle || '')}</p>
        </RoomOverlay>
      )}
      {overlay === 'bookshelf' && (
        <RoomOverlay label={tr('Kệ sách của Jummo', 'Jummo’s bookshelf')} title={tr('Những cuốn sách ưa thích', 'Favorite stories')} onClose={() => setOverlay(null)}>
          {book ? (
            <button className="room-book-choice" type="button" aria-label={localize(book.title)} onClick={openBook}>
              <BookOpen aria-hidden="true" />
              <span><b>{localize(book.title)}</b><small>{localize(book.subtitle || book.body)}</small></span>
            </button>
          ) : <p>{tr('Kệ sách đang chờ thêm câu chuyện.', 'The bookshelf is waiting for more stories.')}</p>}
        </RoomOverlay>
      )}
      {overlay === 'letter' && (
        <RoomOverlay label={tr('Thư bí mật', 'Secret letter')} title={localize(catalog.editorial_entries.find((entry) => entry.section === 'letter')?.title || tr('Gửi các vì sao thân yêu', 'Dear beloved stars'))} onClose={() => setOverlay(null)}>
          <p className="room-letter-copy">{letter}</p>
        </RoomOverlay>
      )}
    </div>
  )
}
