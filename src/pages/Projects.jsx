import { useState } from 'react'
import { normalize, downloadText } from '../lib/archive'
import { Empty, PageIntro, SectionTitle, Tip } from './shared'
import { memories } from '../data/memories'
import ShareCardButton from '../components/ShareCardButton'
const glossary = [
  ['Junior / Juju', 'Tên gọi thân mật dành cho Junior trong góc lưu trữ fansite.'],
  ['Mark / Markji', 'Tên gọi thân mật dành cho Mark trong góc lưu trữ fansite.'],
  ['Bé Mõ Jummo', 'Linh vật kết nối Sun & Moon của JuniorMark.'],
  ['Sun & Moon', 'Hình tượng Ánh Dương và Ánh Nguyệt dùng trong thiết kế.'],
  ['Fancon', 'Sự kiện kết hợp giao lưu fan và biểu diễn.'],
  ['OST', 'Nhạc gắn với phim hoặc chương trình.'],
]
const checklist = [
  'Đọc nguồn chính thức của chiến dịch',
  'Kiểm tra hạn và điều kiện bình chọn',
  'Giữ thông tin tài khoản riêng tư',
  'Tôn trọng bản quyền và người sáng tạo',
  'Cổ vũ bằng nội dung của chính mình',
]
export default function Projects({ showInfo }) {
  // Tracker là dữ liệu mẫu. Checklist và chứng nhận chạy cục bộ, không nhận quyên góp.
  const [query, setQuery] = useState(''),
    [checked, setChecked] = useState([]),
    [name, setName] = useState(''),
    [certificate, setCertificate] = useState(false),
    [copy, setCopy] = useState(''),
    [tweet, setTweet] = useState('Một ngày thật ấm áp cùng Junior & Mark 💛 #JuniorMark')
  const projects = [
    ['LED mừng sinh nhật Junior', 85, 42500000, 50000000],
    ['Food Truck tiếp sức đoàn phim', 100, 35000000, 35000000],
    ['Mang nụ cười cùng bé Jummo', 62, 18600000, 30000000],
  ]
  const terms = glossary.filter((t) => normalize(t.join(' ')).includes(normalize(query)))
  async function copyText() {
    try {
      await navigator.clipboard.writeText(tweet)
      setCopy('Đã sao chép nội dung.')
    } catch {
      setCopy('Không sao chép tự động được; bạn có thể chọn nội dung trong ô để sao chép.')
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="CELESTIAL COMMUNITY HUB"
        title="Fan Hub"
        description="Một trạm nhỏ để tìm hiểu fandom, theo dõi các dự án và bắt đầu hành trình của bạn."
      >
        <Tip>Cùng tìm hiểu và cổ vũ theo nhịp riêng của bạn.</Tip>
      </PageIntro>
      <nav className="page-jump">
        <a href="#/projects?section=tracker">Fan Projects</a>
        <a href="#/projects?section=guide">New Fan Guide / Glossary</a>
        <a href="#/projects?section=vote">Support Guide</a>
        <a href="#/projects?section=pass">Baby Fan / Celestial Pass</a>
      </nav>
      <section id="tracker">
        <SectionTitle eyebrow="Fan Projects · Demo concepts only">
          Fan Projects · Chưa có chiến dịch được xác minh
        </SectionTitle>
        <p className="notice">
          Ba chiến dịch dưới đây là dữ liệu minh họa từ thiết kế. Website chưa mở quyên góp, không
          nhận tiền.
        </p>
        <div className="three-columns">
          {projects.map(([title, progress, amount, goal], i) => (
            <article className="archive-panel project-card" key={title}>
              <img
                src={
                  [
                    '/images/fan-photos/HNr2eA_aUAAAesn.jpg',
                    '/images/fan-photos/HNwNJ4GbsAE5PwW.jpg',
                    '/images/fan-photos/HPWCyKybkAAHKUm.jpg',
                  ][i]
                }
                alt="Ảnh minh họa dự án"
              />
              <span className="eyebrow">DEMO / SAMPLE • DỰ ÁN MẪU • {progress}%</span>
              <h3>{title}</h3>
              <progress max="100" value={progress} />
              <p>
                {amount.toLocaleString('vi-VN')} / {goal.toLocaleString('vi-VN')}đ
              </p>
              <button
                className="secondary-button"
                onClick={() =>
                  showInfo(
                    title,
                    'Đây là thẻ minh họa trong thiết kế. Chưa có đơn vị tổ chức, sao kê hoặc kênh đóng góp được xác minh. Không có giao dịch nào được thực hiện.',
                  )
                }
              >
                Xem thông tin
              </button>
            </article>
          ))}
        </div>
      </section>
      <section id="guide">
        <SectionTitle eyebrow="FAN STARTER KIT & ENCYCLOPEDIA">
          Baby Fan Guide: Cẩm Nang Nhập Môn
        </SectionTitle>
        <div className="archive-panel">
          <h3>Từ Điển Fandom & Giải Mã Thuật Ngữ</h3>
          <label className="search-field">
            Tìm biệt danh / thuật ngữ
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jummo, OST…"
            />
          </label>
          <div className="three-columns">
            {terms.map(([title, body]) => (
              <article className="glossary-card" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          {!terms.length && <Empty>Chưa tìm thấy thuật ngữ phù hợp.</Empty>}
        </div>
      </section>
      <div className="two-columns">
        <section className="archive-panel" id="vote">
          <SectionTitle eyebrow="Support Guide">Hướng Dẫn Bình Chọn</SectionTitle>
          <a className="text-button" href="#/projects?section=stream">Streaming & Trend X ↗</a>
          <p>
            Chưa có cuộc bình chọn được xác minh trong hệ thống. Khi tham gia, đọc điều lệ và giới
            hạn lượt tại cổng chính thức của từng giải.
          </p>
          <div className="checklist">
            {checklist.map((text, i) => (
              <label key={text}>
                <input
                  type="checkbox"
                  checked={checked.includes(i)}
                  onChange={() =>
                    setChecked((c) => (c.includes(i) ? c.filter((n) => n !== i) : [...c, i]))
                  }
                />
                {text}
              </label>
            ))}
          </div>
          <button
            className="secondary-button"
            onClick={() =>
              downloadText(
                'baby-fan-checklist.txt',
                checklist.map((t, i) => `${checked.includes(i) ? '[x]' : '[ ]'} ${t}`).join('\n'),
              )
            }
          >
            Tải checklist ↓
          </button>
        </section>
        <section className="archive-panel" id="stream">
          <SectionTitle eyebrow="STREAMING & TREND X">Cổ Vũ Bằng Giai Điệu Của Bạn</SectionTitle>
          <p>
            Xem video từ nguồn chính thức, tương tác tự nhiên và tôn trọng quy định của nền tảng.
            Không có công thức đảm bảo lượt xem hoặc thứ hạng.
          </p>
          <a
            className="secondary-button"
            href="https://www.youtube.com/@gmmtv"
            target="_blank"
            rel="noreferrer"
          >
            Mở kênh GMMTV ↗
          </a>
          <label className="search-field">
            Soạn lời cổ vũ
            <textarea
              value={tweet}
              maxLength={280}
              onChange={(e) => setTweet(e.target.value)}
              rows={4}
            />
          </label>
          <button className="primary-button" onClick={copyText}>
            Sao chép lời cổ vũ
          </button>
          <p role="status">{copy}</p>
          <small>Nội dung chưa được đăng lên X.</small>
        </section>
      </div>
      <SectionTitle eyebrow="TRỌN BỘ KỶ NGUYÊN">Lộ Trình Khám Phá JuniorMark</SectionTitle>
      <div className="three-columns">
        {memories.map((memory) => (
          <a className="archive-panel" href={`#/timeline?era=${memory.era}`} key={memory.id}>
            <h3>{memory.title}</h3>
            <p>Khám phá cột mốc và ảnh trong kho lưu trữ →</p>
          </a>
        ))}
      </div>
      <section className="archive-panel graduation" id="pass">
        <div>
          <SectionTitle eyebrow="JUMMO CELESTIAL PASS">Nhận Huy Hiệu Baby Fan</SectionTitle>
          <p>Hoàn thành checklist phía trên và ghi tên để nhận thẻ kỷ niệm của fansite.</p>
          <label className="search-field">
            Tên trên thẻ
            <input
              value={name}
              maxLength={50}
              onChange={(e) => {
                setName(e.target.value)
                setCertificate(false)
              }}
            />
          </label>
          <button
            className="primary-button"
            disabled={checked.length !== checklist.length || name.trim().length < 2}
            onClick={() => setCertificate(true)}
          >
            Tạo thẻ kỷ niệm fansite
          </button>
        </div>
        <div className="certificate">
          <img src="/images/jummo-mascot.png" alt="Jummo trên thẻ kỷ niệm" />
          <span className="eyebrow">JUMMO CELESTIAL PASS</span>
          <h3>{certificate ? name.trim() : 'Baby Fan Danh Dự'}</h3>
          <p>{certificate ? 'Đã hoàn thành checklist' : 'Chờ hoàn thành checklist'}</p>
          <small>Thẻ kỷ niệm của fansite, không phải chứng nhận chính thức.</small>
          {certificate && (
            <ShareCardButton card={{ title: name.trim(), subtitle: 'Baby Fan · Jummo Celestial Pass', lines: ['Đã hoàn thành checklist Baby Fan.', 'Thẻ kỷ niệm của fansite, không phải chứng nhận chính thức.'] }} filename="baby-fan-pass" label="Lưu thẻ PNG ↓" />
          )}
        </div>
      </section>
    </>
  )
}
