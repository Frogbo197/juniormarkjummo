import { t as tr, useLanguage, localize } from '../i18n/language'
import { catalog } from '../data/catalog'
import { useState } from 'react'
import { downloadText } from '../lib/archive'
import { Chips, PageIntro, Quiz, SectionTitle } from './shared'
import JummoRoom from './JummoRoom'

export default function JummoWorld({ openPhoto, openAuth }) {
  useLanguage()
  const [roomOpen, setRoomOpen] = useState(false)
  const [roomBusy, setRoomBusy] = useState(false)
  // Năm lần chạm mở thư do fansite biên tập; không gán lời nhắn này cho nghệ sĩ.
  const [mood, setMood] = useState('music'),
    [rain, setRain] = useState(false),
    [rainDrops, setRainDrops] = useState([]),
    [taps, setTaps] = useState(0)

  function toggleRain() {
    if (!rain) {
      setRainDrops(
        Array.from({ length: 18 }, () => {
          const fg = Math.random() > 0.7
          const dur = fg ? 4 + Math.random() * 2 : 6 + Math.random() * 4
          const top = -15 + Math.random() * 95

          return {
            '--drop-left': `${Math.random() * 92 + 2}vw`,
            '--start-top': `${top}vh`,
            '--drop-size': `${fg ? 200 + Math.random() * 40 : 90 + Math.random() * 30}px`,
            '--drop-drift': `${Math.random() * 100 - 30}px`,
            '--drop-rotation': `${Math.random() * 70 - 20}deg`,
            animationDelay: `${Math.random() * 1}s`,
            animationDuration: `${dur}s`,
            opacity: fg ? 0.9 + Math.random() * 0.1 : 0.2 + Math.random() * 0.4,
          }
        }),
      )
    }
    setRain((v) => !v)
  }
  const moods = Object.fromEntries(
    catalog.editorial_entries
      .filter((e) => e.section === 'mood')
      .map((e, i) => [
        ['music', 'book', 'heart'][i] || e.id,
        [
          localize(e.title),
          localize(e.body),
          ['/jummo_dance.gif', '/reading.gif', '/hugging.gif'][i] || e.image,
        ],
      ]),
  )
  const activeMood = moods[mood] ||
    Object.values(moods)[0] || [
      'Jummo',
      tr('Chưa có lời nhắn.', 'No messages yet.'),
      '/images/jummo-mascot.png',
    ]
  const letter = localize(catalog.editorial_entries.find((e) => e.section === 'letter')?.body || '')
  return (
    <>
      {roomOpen && <>
        <button type="button" disabled={roomBusy} className="secondary-button" style={{ marginBottom: 18 }} onClick={() => setRoomOpen(false)}>{tr('← Về Jummo World', '← Back to Jummo World')}</button>
        <JummoRoom openAuth={openAuth} onBusyChange={setRoomBusy} />
      </>}
      <div hidden={roomOpen}>
      <PageIntro
        eyebrow={tr('GÓC BÌNH YÊN CỦA JUNIOR VÀ MARK', 'JUNIOR (SUN) & MARK (MOON) SANCTUARY')}
        title={
          <>
            {' '}
            {tr('Phòng Vũ Trụ Của Jummo Và', 'Jummo’s Cosmic Studio &')}
            <br /> {tr('Gác Xép Bí Mật', 'Secret Attic')}{' '}
          </>
        }
        description={tr(
          'Khám phá phòng sinh hoạt của Jummo, người bạn nhỏ trong dải ngân hà JuniorMark.',
          'Explore the home of Jummo, your little friend in the JuniorMark galaxy.',
        )}
      >
        <div className="account-actions">
        <button type="button" className="primary-button" onClick={() => setRoomOpen(true)}>Room Tour ↗</button>
        <button className="primary-button" onClick={toggleRain} aria-pressed={rain}>
          {rain
            ? tr('Dừng Mưa Jummo', 'Stop Jummo Rain')
            : tr('Kích hoạt Mưa Jummo', 'Start Jummo Rain')}
        </button>
        </div>
      </PageIntro>
      {rain && (
        <div className="jummo-rain" aria-hidden="true">
          {rainDrops.map((style, i) => (
            <img
              key={i}
              src="/images/jummo_rain.png"
              alt=""
              width="135"
              height="135"
              style={style}
            />
          ))}
        </div>
      )}
      <div className="two-columns">
        <section className="archive-panel mascot-stage">
          <button
            aria-label={tr('Chạm Jummo mở thư', 'Tap Jummo to open the letter')}
            onClick={() => setTaps((n) => Math.min(5, n + 1))}
          >
            <img src={activeMood[2]} alt={activeMood[0]} />
          </button>
          <p>
            {activeMood[0]} {tr('• Chạm', '• Taps')} {taps}/5
          </p>
        </section>
        <section className="archive-panel mood-console">
          <SectionTitle eyebrow={tr('BẢNG CHỌN TÂM TRẠNG', 'MOOD SWITCHER CONSOLE')}>
            {tr('Chọn biểu cảm & phụ kiện', 'Choose expressions & accessories')}
          </SectionTitle>
          <Chips
            label={tr('Tâm trạng Jummo', 'Jummo mood')}
            value={mood}
            onChange={setMood}
            options={Object.entries(moods).map(([id, m]) => [
              id,
              <span className="mood-option" key={id}>
                <img src={m[2]} alt="" width="40" height="40" />
                {m[0]}
              </span>,
            ])}
          />
          <h3 aria-live="polite">{activeMood[1]}</h3>
          <div className="profile-tags">
            <span>{tr('Xanh Vũ Trụ & Vàng Ánh Dương', 'Cosmic Blue & Sun Gold')}</span>
            <span>{tr('Gắn kết trái tim', 'Connecting hearts')}</span>
          </div>
          <a className="text-button" href="#/wall">
            {' '}
            {tr('Jummo chào bạn • Gửi nốt nhạc →', 'Hello from Jummo • Leave a note →')}{' '}
          </a>
        </section>
      </div>
      <SectionTitle
        eyebrow={tr('KHOẢNH KHẮC BÍ MẬT VÀ NHỮNG CÁI ÔM', 'SECRET MOMENTS & WARM HUGS')}
      >
        {' '}
        {tr('Những Cái Ôm Ngọt Ngào Bên Jummo', 'Sweet Hugs with Jummo')}{' '}
      </SectionTitle>
      <div className="three-columns">
        {[
          [
            '/images/junior-mark.png',
            tr('Vòng tay bên người bạn nhỏ', 'An embrace with our little friend'),
          ],
          [
            '/images/fan-photos/HPWCyKybkAAHKUm.jpg',
            tr('Jummo cùng biển bong bóng', 'Jummo in a sea of bubbles'),
          ],
          [
            '/images/fan-photos/HLlKtNeaUAA42uM.jpg',
            tr('Nhật ký những ngày bình yên', 'A diary of peaceful days'),
          ],
        ].map(([src, title]) => (
          <button
            className="image-story"
            key={src}
            onClick={() =>
              openPhoto({
                src,
                title,
                alt: title,
                credit: tr(
                  'Ảnh từ thiết kế / bộ ảnh người dùng cung cấp',
                  'Photo from the design / user-supplied collection',
                ),
              })
            }
          >
            <img src={src} alt={title} />
            <div>
              <h3>{title}</h3>
            </div>
          </button>
        ))}
      </div>
      <section className="archive-panel attic-panel">
        <div>
          <SectionTitle eyebrow={tr('KHO THƯ TAY BÍ MẬT', 'SECRET HANDWRITTEN VAULT')}>
            {' '}
            {tr('Hòm Thư Tay Bí Mật Từ Tầng Gác Xép', 'The Secret Letterbox in the Attic')}{' '}
          </SectionTitle>
          <p>
            {tr(
              'Chạm vào Jummo 5 lần để mở lời nhắn kỷ niệm của fansite.',
              'Tap Jummo 5 times to open the fansite keepsake message.',
            )}
          </p>
          <progress max="5" value={taps} />
        </div>
        <div className="letter-paper">
          {taps === 5 ? (
            <>
              <h3>{tr('Gửi các vì sao thân yêu', 'Dear beloved stars')}</h3>
              <p>{letter}</p>
              <button
                className="secondary-button"
                onClick={() => downloadText('loi-nhan-jummo.txt', letter)}
              >
                {' '}
                {tr('Lưu dòng chữ này ↓', 'Save this message ↓')}{' '}
              </button>
            </>
          ) : (
            <p>
              {tr('✉ Phong thư đang chờ bạn •', '✉ Your letter is waiting •')} {taps}/5
            </p>
          )}
        </div>
      </section>
      <SectionTitle eyebrow={tr('QUÀ TẶNG SỐ CỦA JUMMO', 'JUMMO GOODIES & DIGITAL MERCH')}>
        {tr('Tải Về Quà Tặng Của Jummo', 'Download Jummo Gifts')}
      </SectionTitle>
      <div className="three-columns">
        {catalog.downloads.map((item) => (
          <article className="archive-panel" key={item.id}>
            <h3>{localize(item.title)}</h3>
            <p>{localize(item.description)}</p>
            {item.url ? (
              <a className="secondary-button" href={item.url} download>
                {tr('Tải về ↓', 'Download ↓')}
              </a>
            ) : (
              <button className="secondary-button" disabled>
                {tr('Chưa có gói tải', 'No download package yet')}
              </button>
            )}
          </article>
        ))}
      </div>
      <Quiz />
      </div>
    </>
  )
}
