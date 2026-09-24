import { useState } from 'react'
import { quizResult } from '../lib/archive'
import ShareCardButton from '../components/ShareCardButton'

export function PageIntro({ eyebrow, title, description, children }) {
  return (
    <header className="archive-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 tabIndex={-1}>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </header>
  )
}
export function Chips({ label, options, value, onChange }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map(([id, name]) => (
        <button type="button" key={id} aria-pressed={value === id} onClick={() => onChange(id)}>
          {name}
        </button>
      ))}
    </div>
  )
}
export function SectionTitle({ eyebrow, children }) {
  return (
    <div className="archive-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{children}</h2>
    </div>
  )
}
export function Empty({ children }) {
  return (
    <p className="empty-state" role="status">
      {children}
    </p>
  )
}
export function Tip({ children, title = 'Jummo nhắc bạn', className = '', image = '/images/jummo-mascot.png' }) {
  return (
    <aside className={`archive-tip ${className}`.trim()}>
      <img src={image} width="48" height="58" alt="Jummo" />
      <div>
        <b>{title}</b>
        <p>{children}</p>
      </div>
    </aside>
  )
}
export function Quiz() {
  const [answers, setAnswers] = useState([]),
    [result, setResult] = useState(false)
  const questions = [
    'Một ngày mệt mỏi khép lại, bạn muốn điều gì?',
    'Bạn sẽ mang gì đến tiệm đĩa?',
    'Điều bạn muốn gửi tới JuniorMark?',
  ]
  const choices = [
    ['Một buổi jam tràn năng lượng', 'Một giai điệu thật dịu', 'Một cái ôm của Jummo'],
    ['Hoa hướng dương', 'Một chiếc đĩa yêu thích', 'Một lá thư nhỏ'],
    ['Nụ cười và sức mạnh', 'Bình yên và cảm hứng', 'Tình yêu của cả fandom'],
  ]
  const title = ['Solar — Ánh Dương', 'Lunar — Ánh Nguyệt', 'Jummo — Sunflower'][
    quizResult(answers)
  ]
  return (
    <section className="archive-panel quiz-panel">
      <span className="eyebrow">CELESTIAL SOUL TEST • MINI QUIZ</span>
      <h2>Góc Sưu Tầm Thẻ Bài</h2>
      {result ? (
        <>
          <img className="quiz-mascot" src="/images/jummo-mascot.png" alt="Thẻ Jummo" />
          <h3>{title}</h3>
          <p>Thẻ kỷ niệm vui dành riêng cho bạn.</p>
          <ShareCardButton card={{ title, subtitle: 'Celestial Soul · Quiz keepsake', lines: ['Thẻ kỷ niệm vui dành riêng cho bạn.'] }} filename="jummo-quiz" label="Lưu thẻ kỷ niệm PNG" />
          <button
            className="text-button"
            onClick={() => {
              setAnswers([])
              setResult(false)
            }}
          >
            Làm lại
          </button>
        </>
      ) : (
        <>
          <p>Câu hỏi {answers.length + 1}/3</p>
          <h3>{questions[answers.length]}</h3>
          <div className="quiz-options">
            {choices[answers.length].map((c, i) => (
              <button
                key={c}
                onClick={() => {
                  const next = [...answers, i]
                  setAnswers(next)
                  if (next.length === 3) setResult(true)
                }}
              >
                {String.fromCharCode(65 + i)} · {c}
              </button>
            ))}
          </div>
          <progress max="3" value={answers.length} />
        </>
      )}
    </section>
  )
}
