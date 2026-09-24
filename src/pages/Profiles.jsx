import { useState } from 'react'
import { Chips, PageIntro, SectionTitle, Tip } from './shared'
import { photoPath } from './journeyData'
import { memoriesForPerson } from '../data/memories'

export default function Profiles({ person = 'duo' }) {
  const [selected, setSelected] = useState(person),
    [fact, setFact] = useState(0)
  const people = [
    {
      id: 'junior',
      name: 'Junior Panachai',
      handle: '@junniorrs',
      birthday: '23 tháng 10',
      image: 'HNr2eA_aUAAAesn.jpg',
      theme: 'ÁNH DƯƠNG',
      text: 'Góc hồ sơ của Junior — diễn xuất, sân khấu và những khoảnh khắc đời thường.',
      skills: ['Diễn xuất', 'Host / MC', 'Sân khấu'],
    },
    {
      id: 'mark',
      name: 'Mark Jiruntanin',
      handle: '@markjrtn',
      birthday: '15 tháng 6',
      image: 'HLt1Jy5bcAAdFxD.jpg',
      theme: 'ÁNH NGUYỆT',
      text: 'Góc hồ sơ của Mark — những vai diễn, âm nhạc và nụ cười thân quen.',
      skills: ['Diễn xuất', 'Âm nhạc', 'Acoustic'],
    },
  ]
  return (
    <>
      <PageIntro
        eyebrow="ORBITAL DOSSIER & ARCHIVES / HỒ SƠ TINH TÚ"
        title={
          <>
            The Sun, The Moon & <em>Their Orbit</em>
          </>
        }
        description="Hai sắc màu, một hành trình được lưu giữ cùng JuniorMark và Jummo."
      >
        <Chips
          label="Chọn hồ sơ"
          value={selected}
          onChange={setSelected}
          options={[
            ['duo', 'Celestial Duo'],
            ['junior', 'Junior Panachai'],
            ['mark', 'Mark Jiruntanin'],
          ]}
        />
      </PageIntro>
      <div className="profile-grid">
        {people
          .filter((p) => selected === 'duo' || p.id === selected)
          .map((p) => (
            <article className={`archive-panel profile-card ${p.id}`} key={p.id}>
              <span className="eyebrow">{p.theme} • GMMTV ARTIST</span>
              <div className="profile-main">
                <img src={photoPath(p.image)} alt={p.name} />
                <div>
                  <h2>{p.name}</h2>
                  <p className="blue">{p.birthday}</p>
                  <p>{p.text}</p>
                  <div className="profile-tags">
                    {p.skills.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
      </div>
      <section className="archive-panel">
        <SectionTitle eyebrow="CELESTIAL HARMONIC MATRIX">
          Duyên Nợ Tinh Cầu: Sun & Moon Duality
        </SectionTitle>
        <div className="duality-grid">
          <div>
            <h3>☀ Junior • The Sun</h3>
            <p>Ánh dương ấm áp, sự đồng hành và những câu chuyện được kể bằng nụ cười.</p>
          </div>
          <img src="/images/jummo-mascot.png" alt="Jummo kết nối Sun & Moon" />
          <div>
            <h3>☾ Mark • The Moon</h3>
            <p>Ánh nguyệt dịu dàng, âm nhạc và những khoảng lặng trong góc nhỏ của fandom.</p>
          </div>
        </div>
      </section>
      <SectionTitle eyebrow="AUDIO & LETTER ARCHIVES">Liner Notes & Voice Memos</SectionTitle>
      <div className="two-columns">
        {['Mặt Trời Sau Cơn Mưa', 'Khúc Hát Giữa Dải Ngân Hà'].map((s, i) => (
          <article className="archive-panel" key={s}>
            <h3>
              Voice Memo #{i + 1}: {s}
            </h3>
            <p>Tên chuyên mục từ thiết kế. Bản ghi âm sẽ được bổ sung khi có nguồn.</p>
            <button className="secondary-button" disabled>
              Chưa có bản thu
            </button>
          </article>
        ))}
      </div>
      <SectionTitle eyebrow="CELESTIAL TRAJECTORY">The Vertical Couple Journey</SectionTitle>
      <div className="vertical-journey">
        {memoriesForPerson(selected).map((e, i) => (
          <article key={e.id}>
            <div>
              <span className="eyebrow">
                {e.year} • ARC 0{i + 1}
              </span>
              <h3>{e.title}</h3>
              <p>{e.roles}</p>
              <p>{e.text}</p>
              <a href={`#/timeline?era=${e.id}`} className="text-button">
                Khám phá cột mốc ↗
              </a>
            </div>
            <img src={photoPath(e.image)} alt={`Ảnh bộ sưu tập ${e.title}`} loading="lazy" />
          </article>
        ))}
      </div>
      <Tip>
        {
          [
            'Jummo là góc kết nối hai sắc màu Sun & Moon trong thiết kế fansite.',
            'Bạn có thể lưu ngày sinh nhật ở Studio để thêm vào lịch cá nhân.',
            'Media Hub lưu ảnh gốc và ghi nguồn để bạn dễ tìm lại.',
          ][fact]
        }{' '}
        <button className="text-button" onClick={() => setFact((fact + 1) % 3)}>
          Đổi lời nhắc
        </button>
      </Tip>
    </>
  )
}