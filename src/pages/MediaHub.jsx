import { useEffect, useState } from 'react'
import { photos } from '../lib/photos'
import { memories, memoryForPhoto } from '../data/memories'
import { filterPhotos } from '../lib/archive'
import { Chips, Empty, PageIntro, SectionTitle } from './shared'

const library = photos.map((p, i) => ({
  ...p,
  memoryId: memoryForPhoto(p.file)?.id,
  era: memoryForPhoto(p.file)?.era,
  person: [0, 1, 4, 10, 12, 14, 15].includes(i)
    ? 'duo'
    : i === 3
      ? 'jummo'
      : [8, 11].includes(i)
        ? 'junior'
        : 'mark',
  topic: [0, 3, 12, 15].includes(i)
    ? 'stage'
    : [2, 5, 6, 9, 11, 13].includes(i)
      ? 'portrait'
      : 'cozy',
}))
export default function MediaHub({ openPhoto }) {
  // Kết hợp các bộ lọc trước khi phân trang; tải ảnh dùng file gốc, không dùng thumbnail.
  const [query, setQuery] = useState(''),
    [person, setPerson] = useState('all'),
    [topic, setTopic] = useState('all'),
    [era, setEra] = useState(() => new URLSearchParams(location.hash.split('?')[1]).get('era') || 'all'),
    [source, setSource] = useState('all'),
    [sort, setSort] = useState('original'),
    [limit, setLimit] = useState(8)
  let items = filterPhotos(library, { query, person, topic })
    .filter((photo) => (era === 'all' || photo.era === era) && (source === 'all' || (source === 'official' ? photo.credit === 'GMMTV' : photo.credit !== 'GMMTV')))
  useEffect(() => {
    const sync = () => { setEra(new URLSearchParams(location.hash.split('?')[1]).get('era') || 'all'); setLimit(8) }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  if (sort === 'title') items = [...items].sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'reverse') items = [...items].reverse()
  return (
    <>
      <PageIntro
        eyebrow="CELESTIAL ARCHIVE • PHOTO VAULT"
        title="Visual Archive · Kho Truyền Thông"
        description="Lưu giữ ánh sáng sân khấu, những khoảnh khắc đời thường và bé linh vật Jummo."
      >
        <div className="stat-pill">
          <strong>{photos.length}</strong>
          <span>ẢNH TRONG THƯ VIỆN</span>
        </div>
      </PageIntro>
      <section className="archive-panel media-filters">
        <Chips label="Editorial era" value={era} onChange={(value) => { setEra(value); setLimit(8) }} options={[[ 'all', 'All eras' ], ...memories.map((memory) => [memory.era, memory.title])]} />
        <Chips label="Photo source" value={source} onChange={(value) => { setSource(value); setLimit(8) }} options={[[ 'all', 'All sources' ], ['official', 'Official source · GMMTV'], ['supplied', 'Fan / supplied collection']]} />
        <Chips
          label="Nhân vật"
          value={person}
          onChange={(v) => {
            setPerson(v)
            setLimit(8)
          }}
          options={[
            ['all', 'Tất cả'],
            ['junior', 'Junior Only'],
            ['mark', 'Mark Only'],
            ['duo', 'JuniorMark Couple'],
            ['jummo', 'Jummo'],
          ]}
        />
        <Chips
          label="Chủ đề"
          value={topic}
          onChange={(v) => {
            setTopic(v)
            setLimit(8)
          }}
          options={[
            ['all', 'Tất cả chủ đề'],
            ['stage', 'Sân khấu'],
            ['portrait', 'Chân dung'],
            ['cozy', 'Đời thường'],
          ]}
        />
        <label className="search-field">
          Tìm theo tên, mô tả hoặc credit
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(8)
            }}
            placeholder="Nhập từ khóa…"
          />
        </label>
        <p className="muted">Undated archive · Ảnh chưa có ngày chụp xác thực nên chưa phân loại theo năm. Era links are editorial associations, not confirmation of where or when a photo was taken.</p>
      </section>
      <div className="archive-heading toolbar">
        <h2>Phòng Lưu Trữ Hình Ảnh</h2>
        <span aria-live="polite">{items.length} kết quả</span>
        <label>
          Sắp xếp{' '}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="original">Thứ tự bộ sưu tập</option>
            <option value="reverse">Thứ tự ngược</option>
            <option value="title">Tên A–Z</option>
          </select>
        </label>
      </div>
      <div className="media-grid">
        {items.slice(0, limit).map((p) => (
          <article className="media-photo" key={p.file}>
            <button onClick={() => openPhoto(p)} aria-label={`Xem ảnh ${p.title}`}>
              <img src={p.src} style={{ objectPosition: p.position }} alt={p.alt} loading="lazy" />
              <span>{p.tag}</span>
            </button>
            <div>
              <h3>{p.title}</h3>
              <p>{p.credit}</p>
              {p.memoryId && <a href={`#/timeline?era=${p.era}&memory=${p.memoryId}`}>Related editorial memory ↗</a>}
              <a href={p.src} download={p.file}>
                Tải ảnh gốc ↓
              </a>
            </div>
          </article>
        ))}
      </div>
      {!items.length && <Empty>Chưa có ảnh phù hợp. Thử thay từ khóa hoặc bộ lọc.</Empty>}
      {limit < items.length && (
        <button className="secondary-button load-more" onClick={() => setLimit((n) => n + 8)}>
          Tải thêm ảnh ({items.length - limit})
        </button>
      )}
      <SectionTitle eyebrow="CINEMATIC ARCHIVES">Video Vault & Thước Phim Kỷ Niệm</SectionTitle>
      <div className="video-vault archive-panel">
        <img src="/images/fan-photos/HNwgVKGbsAA2z-b.jpg" alt="Khoảnh khắc sân khấu JuniorMark" />
        <div>
          <h2>JuniorMark trên kênh GMMTV</h2>
          <p>
            Khám phá video từ kênh chính thức. Các fancam và video có Vietsub trong thiết kế sẽ được
            thêm khi có liên kết nguồn cụ thể.
          </p>
          <a
            className="primary-button"
            href="https://www.youtube.com/@gmmtv"
            target="_blank"
            rel="noreferrer"
          >
            Mở kênh GMMTV ↗
          </a>
        </div>
      </div>
      <section className="archive-panel">
        <SectionTitle eyebrow="EXCLUSIVE FANSITE BUNDLES">Tải Trọn Bộ Ảnh Gốc</SectionTitle>
        <p>
          Hiện có thể tải từng ảnh bằng nút dưới ảnh. Các gói Fan-Pack, RAW và photobook trong mẫu
          chưa được cung cấp.
        </p>
        <p className="muted">
          Giữ nguyên watermark và ghi nguồn khi chia sẻ. Nguồn mỗi ảnh nằm trong cửa sổ xem ảnh.
        </p>
      </section>
    </>
  )
}
