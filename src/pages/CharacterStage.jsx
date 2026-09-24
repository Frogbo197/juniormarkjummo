import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ProfileDossier from './ProfileDossier'

// Frame 2002:35: nhân vật đang chọn ở giữa; hai nhân vật phụ hai bên.
const characters = [
  {
    id: 'jummo',
    name: 'Jummo Mascot',
    tag: 'CELESTIAL GUARDIAN',
    image: '/images/jummo-mascot.png',
    description:
      'Người bạn nhỏ kết nối Ánh Dương & Ánh Nguyệt. Ghé gác xép của Jummo để khám phá lời nhắn và những món quà.',
    href: '#/jummo',
  },
  {
    id: 'junior',
    name: 'Junior Panachai',
    tag: 'SOLAR RADIANCE',
    image: '/images/junior-stage.png',
    description: 'Khám phá hồ sơ Ánh Dương Panachai và những cột mốc trong hành trình JuniorMark.',
    href: '#/profiles/junior',
  },
  {
    id: 'mark',
    name: 'Mark Jiruntanin',
    tag: 'LUNAR MELODY',

    image: '/images/mark-stage.png',
    description:
      'Khám phá hồ sơ Ánh Nguyệt Jiruntanin, góc âm nhạc và những khoảnh khắc được lưu giữ.',
    href: '#/profiles/mark',
  },
]
export default function CharacterStage() {
  const [active, setActive] = useState(0),
    [open, setOpen] = useState(false),
    current = characters[active]
  const move = (direction) => setActive((i) => (i + direction + 3) % 3)
  return (
    <section
      className="character-selector"
      aria-label="Chọn nhân vật xem hồ sơ"
      onKeyDown={(e) => {
        if (open) return
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          move(-1)
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          move(1)
        }
      }}
    >
      <header className="stage-intro">
        <span className="eyebrow">ORBITAL DOSSIER & ARCHIVES</span>
        <h1>The Sun, The Moon & Their Orbit</h1>
        <p>Chọn nhân vật rồi bấm Discover để khám phá hồ sơ.</p>
      </header>
      <div className={`character-stage active-${current.id}`}>
        <span className="ghost-type" aria-hidden="true">
          {current.id.toUpperCase()}
        </span>
        {characters.map((c, i) => {
          const position = (i - active + 3) % 3
          return (
            <button
              key={c.id}
              className={`stage-person ${['center', 'right', 'left'][position]} ${c.id}`}
              onClick={() => setActive(i)}
              aria-label={`Chọn ${c.name}`}
              aria-pressed={active === i}
            >
              {active === i && <span className="active-pill">● ACTIVE SELECTION</span>}
              <img src={c.image} alt={c.name} />
              <span className="stage-person-name">{c.name}</span>
            </button>
          )
        })}
      </div>
      <div className="stage-bottom">
        <article className="stage-bio archive-panel" aria-live="polite">
          <span className="eyebrow">
            {current.tag} • {current.id === 'jummo' ? 'STUDIO MASCOT' : 'GMMTV ARTIST'}
          </span>
          <h2>{current.name}</h2>
          <p>{current.description}</p>
          <div className="stage-controls">
            <button className="icon-button" aria-label="Nhân vật trước" onClick={() => move(-1)}>
              <ArrowLeft size={18} />
            </button>
            <button className="icon-button" aria-label="Nhân vật tiếp theo" onClick={() => move(1)}>
              <ArrowRight size={18} />
            </button>
            <div className="stage-dots">
              {characters.map((c, i) => (
                <button
                  key={c.id}
                  aria-label={`Chuyển tới ${c.name}`}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
          </div>
        </article>
        <button
          className="discover-button"
          onClick={() => setOpen(true)}
          aria-label={`Discover ${current.name}`}
        >
          DISCOVER <ArrowRight size={28} />
        </button>
      </div>
      {open && <ProfileDossier person={current.id} onClose={() => setOpen(false)} />}
    </section>
  )
}
