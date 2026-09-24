import { useState } from 'react'
import { calendarCells, downloadText, eventCalendar } from '../lib/archive'
import { Chips, Empty, PageIntro, Tip } from './shared'
import SaveToOrbit from '../components/SaveToOrbit'

// Lịch minh họa tách riêng; không dẫn tới mua vé hoặc ghi danh giả.
const examples = [
  {
    id: 'acoustic',
    date: '2026-06-15',
    title: 'Birthday Acoustic Night • Starlit Echoes',
    category: 'fancon',
    demo: true,
    image: 'HLt1Jy5bcAAdFxD.jpg',
  },
  {
    id: 'press',
    date: '2026-09-15',
    title: 'My Romance Scammer • Press Conference',
    category: 'press',
    demo: true,
    image: 'HNwNJ4GbsAE5PwW.jpg',
  },
  {
    id: 'gathering',
    date: '2026-10-23',
    title: 'Sunflowers for You • Birthday Gathering',
    category: 'fancon',
    demo: true,
    image: 'HNr2eA_aUAAAesn.jpg',
  },
]
export default function Schedule({ showInfo }) {
  const now = new Date(),
    [year, setYear] = useState(now.getFullYear()),
    [month, setMonth] = useState(now.getMonth()),
    [view, setView] = useState(() => window.matchMedia?.('(max-width: 640px)').matches ? 'agenda' : 'list'),
    [category, setCategory] = useState('all'),
    [demo, setDemo] = useState(false)
  const birthdays = [
    {
      id: 'junior',
      date: `${year}-10-23`,
      title: 'Sinh nhật Junior Panachai',
      category: 'birthday',
      description: 'Ngày sinh nhật, không phải lịch fanmeeting.',
      image: 'HNr2eA_aUAAAesn.jpg',
    },
    {
      id: 'mark',
      date: `${year}-06-15`,
      title: 'Sinh nhật Mark Jiruntanin',
      category: 'birthday',
      description: 'Ngày sinh nhật, không phải lịch fanmeeting.',
      image: 'HLt1Jy5bcAAdFxD.jpg',
    },
  ]
  const events = [...birthdays, ...(demo ? examples : [])]
    .filter(
      (e) => (category === 'all' || e.category === category) && Number(e.date.slice(0, 4)) === year,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
  function shift(n) {
    if (view === 'agenda') { setYear((current) => current + n); return }
    const d = new Date(year, month + n, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }
  function save(list) {
    downloadText('juniormark-calendar.ics', eventCalendar(list), 'text/calendar;charset=utf-8')
  }
  return (
    <>
      <PageIntro
        eyebrow="ORBIT CALENDAR • GMT+7"
        title="Lịch Trình Tinh Tú • JuniorMark"
        description="Theo dõi những ngày đặc biệt và lưu vào lịch cá nhân."
      >
        <div className="toolbar">
          <button className="primary-button" onClick={() => save(events)} disabled={!events.length}>
            Tải file .ICS ↓
          </button>
          <button
            className="secondary-button"
            onClick={() =>
              showInfo(
                'Đồng bộ lịch',
                'Tải file .ICS rồi nhập vào Google Calendar hoặc Apple Calendar. Đây là bản nhập một lần, chưa phải lịch tự đồng bộ.',
              )
            }
          >
            Google / Apple Calendar
          </button>
        </div>
      </PageIntro>
      <Tip>
        Ngày sinh nhật luôn có sẵn. Bật “Xem lịch minh họa” để xem các thẻ sự kiện trong mẫu thiết
        kế; đây không phải lịch đã xác nhận.
      </Tip>
      <label className="demo-switch">
        <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} /> Xem
        lịch minh họa thiết kế
      </label>
      <div className="archive-panel toolbar">
        <Chips
          label="Kiểu xem lịch"
          value={view}
          onChange={setView}
          options={[
            ['agenda', 'Agenda'],
            ['list', 'Dòng thời gian'],
            ['month', 'Lịch tháng'],
          ]}
        />
        <Chips
          label="Loại sự kiện"
          value={category}
          onChange={setCategory}
          options={[
            ['all', 'Tất cả'],
            ['birthday', 'Sinh nhật'],
            ['fancon', 'Fan Meeting • Concert'],
            ['press', 'Phim / Press'],
          ]}
        />
      </div>
      <div className="toolbar month-toolbar">
        <button className="icon-button" aria-label={view === 'agenda' ? 'Năm trước' : 'Tháng trước'} onClick={() => shift(-1)}>
          ←
        </button>
        <h2>
          {view === 'agenda' ? `Agenda · ${year}` : `Tháng ${month + 1}, ${year}`}
        </h2>
        <button className="icon-button" aria-label={view === 'agenda' ? 'Năm sau' : 'Tháng sau'} onClick={() => shift(1)}>
          →
        </button>
        <button
          className="text-button"
          onClick={() => {
            setYear(now.getFullYear())
            setMonth(now.getMonth())
          }}
        >
          Hôm nay
        </button>
      </div>
      {view === 'agenda' && <nav className="date-rail" aria-label="Agenda dates">{events.map((event) => <a key={event.id} href={`#/schedule?section=event-${event.id}`}>{event.date.slice(5)} · {event.demo ? 'DEMO' : 'Birthday'}</a>)}</nav>}
      {view === 'month' ? (
        <div className="month-grid" aria-label={`Lịch tháng ${month + 1}/${year}`}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <b key={d}>{d}</b>
          ))}
          {calendarCells(year, month).map((day, i) => (
            <div key={i} className={!day ? 'blank-day' : ''}>
              {day && (
                <>
                  <span>{day}</span>
                  {events
                    .filter(
                      (e) =>
                        e.date ===
                        `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                    )
                    .map((e) => (
                      <button
                        key={e.id}
                        onClick={() =>
                          showInfo(
                            e.title,
                            e.demo
                              ? 'Sự kiện minh họa thiết kế, chưa có thông báo chính thức.'
                              : e.description,
                          )
                        }
                      >
                        {e.demo ? 'Mẫu · ' : ''}
                        {e.title}
                      </button>
                    ))}
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="event-list">
          {events
            .filter((e) => view === 'agenda' || Number(e.date.slice(5, 7)) === month + 1)
            .map((e) => (
              <article className="archive-panel event-card" id={`event-${e.id}`} key={e.id}>
                <img src={`/images/fan-photos/${e.image}`} alt="Ảnh minh họa JuniorMark" />
                <div>
                  <span className="eyebrow">
                    {e.date.split('-').reverse().join('/')} • {e.demo ? 'DEMO / SAMPLE · LỊCH MẪU' : 'UNCONFIRMED · Archive birthday reminder'}
                  </span>
                  <h3>{e.title}</h3>
                  <p>
                    {e.demo
                      ? 'Nội dung từ bản thiết kế, chưa xác nhận ngày giờ hoặc địa điểm.'
                      : e.description}
                  </p>
                  <button className="secondary-button" onClick={() => save([e])}>
                    Lưu vào lịch ↓
                  </button>
                  <SaveToOrbit kind="event" id={`${e.id}-${e.date}`} payload={{ title: e.title, date: e.date, demo: Boolean(e.demo) }} />
                </div>
              </article>
            ))}
          {!events.some((e) => view === 'agenda' || Number(e.date.slice(5, 7)) === month + 1) && (
            <Empty>Chưa có sự kiện trong tháng này.</Empty>
          )}
        </div>
      )}
      <div className="three-columns schedule-tips">
        {[
          [
            'Quy chuẩn fandom',
            'Theo dõi quy định riêng của đơn vị tổ chức về banner, máy ảnh và đồ mang vào.',
          ],
          [
            'Di chuyển & địa điểm',
            'Kiểm tra địa chỉ trên thông báo chính thức trước khi lên lịch đi lại.',
          ],
          [
            'Theo dõi thông báo',
            'Lịch trong fansite không thay thế thông báo của GMMTV hoặc đơn vị tổ chức.',
          ],
        ].map(([h, p]) => (
          <article className="archive-panel" key={h}>
            <h3>{h}</h3>
            <p>{p}</p>
          </article>
        ))}
      </div>
    </>
  )
}
