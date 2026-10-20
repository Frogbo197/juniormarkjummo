import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ShowerHead } from 'lucide-react'
import { t as tr } from '../../i18n/language'
import CarePanel from './CarePanel'
import './BathRoom.css'

const ART = '/images/jummo-room/bath/'
const PATCHES = Array.from({ length: 12 }, (_, i) => ({ x: 39 + (i % 4) * 7, y: 39 + Math.floor(i / 4) * 11 }))
const freshFoam = () => PATCHES.map(() => 0)

export default function BathRoom({ stats, completeBath, onBack }) {
  const [foam, setFoam] = useState(freshFoam)
  const [soaped, setSoaped] = useState(false)
  const [soap, setSoap] = useState({ x: 20, y: 67 })
  const soapPosition = useRef({ x: 20, y: 67 })
  const covered = useRef(new Set())
  const tool = useRef(null)
  const [done, setDone] = useState(false)
  const [running, setRunning] = useState(false)
  const [nozzle, setNozzle] = useState({ x: 77, y: 22 })
  const scene = useRef(null)
  const activePointer = useRef(null)
  const water = useRef({ running: false, x: 77, y: 22 })
  const remaining = useRef(freshFoam())
  const rewarded = useRef(false)
  const reward = useRef(completeBath)
  useEffect(() => { reward.current = completeBath }, [completeBath])

  function stop() {
    activePointer.current = null
    tool.current = null
    water.current.running = false
    setRunning(false)
  }
  useEffect(() => {
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', stop)
    return () => {
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', stop)
    }
  }, [])
  useEffect(() => {
    if (!soaped || done) return
    const timer = window.setInterval(() => {
      const w = water.current
      if (!w.running || document.hidden) return
      remaining.current = remaining.current.map((amount, i) => {
        const p = PATCHES[i]
        const depth = p.y - w.y
        return depth > 3 && depth < 49 && Math.abs(p.x - w.x) < 5 + depth * .16
          ? Math.max(0, amount - .055) : amount
      })
      setFoam([...remaining.current])
      if (covered.current.size === PATCHES.length && remaining.current.every((amount) => amount === 0) && !rewarded.current) {
        rewarded.current = true
        reward.current()
        setDone(true)
        stop()
      }
    }, 80)
    return () => window.clearInterval(timer)
  }, [soaped, done])

  function move(event) {
    if (activePointer.current !== event.pointerId) return
    const bounds = scene.current.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const position = {
      x: Math.max(8, Math.min(92, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(8, Math.min(72, (event.clientY - bounds.top) / bounds.height * 100)),
    }
    if (tool.current === 'soap') {
      soapPosition.current = position; setSoap(position); lather(position)
    } else {
      water.current = { ...position, running: true }; setNozzle(position)
    }
  }
  function lather(position) {
    remaining.current = remaining.current.map((amount, i) => {
      if (Math.hypot(PATCHES[i].x - position.x, (PATCHES[i].y - position.y) * .65) > 9) return amount
      covered.current.add(i)
      return Math.min(1, amount + .35)
    })
    setFoam([...remaining.current])
    if (covered.current.size) setSoaped(true)
  }
  function start(event, selectedTool = 'shower') {
    if (event.button !== 0 || event.isPrimary === false || activePointer.current !== null || done) return
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointer.current = event.pointerId
    tool.current = selectedTool
    water.current.running = selectedTool === 'shower'
    setRunning(selectedTool === 'shower')
    move(event)
  }
  function keyboard(event, selectedTool = 'shower') {
    if (done) return
    const directions = { ArrowLeft: [-3, 0], ArrowRight: [3, 0], ArrowUp: [0, -3], ArrowDown: [0, 3] }
    if (directions[event.key]) {
      event.preventDefault()
      const [dx, dy] = directions[event.key]
      const current = selectedTool === 'soap' ? soapPosition.current : water.current
      const position = { x: Math.max(8, Math.min(92, current.x + dx)), y: Math.max(8, Math.min(72, current.y + dy)) }
      if (selectedTool === 'soap') { soapPosition.current = position; setSoap(position); lather(position); return }
      water.current = { ...water.current, ...position }
      setNozzle(position)
    } else if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault()
      if (selectedTool === 'soap') { lather(soapPosition.current); return }
      water.current.running = !water.current.running
      setRunning(water.current.running)
    }
  }
  const progress = Math.round((covered.current.size - foam.reduce((a, b) => a + b, 0)) / PATCHES.length * 100)
  return <div className="jr-bath">
    <div className="jr-bath-toolbar">
      <button type="button" onClick={onBack}><ArrowLeft size={18} />{tr('Về phòng', 'Back to room')}</button>
      <strong>{tr('Giờ tắm của Jummo', 'Jummo’s bath time')}</strong>
      <span>{progress}%</span>
    </div>
    <CarePanel stats={stats} />
    <div ref={scene} className="jr-bath-scene" data-testid="bath-scene">
      <img className="jr-bath-background" src={`${ART}background.png`} alt="" draggable="false" />
      <img className="jr-bath-character" src={`${ART}${running || done ? 'mobath2.png' : 'mobath.png'}`} alt={tr('Jummo trong bồn tắm', 'Jummo in the bathtub')} draggable="false" />
      {soaped && PATCHES.map((patch, i) => <span key={i} className="jr-bath-foam" aria-hidden="true" style={{ left: `${patch.x}%`, top: `${patch.y}%`, opacity: foam[i], transform: `translate(-50%, -50%) scale(${.45 + foam[i] * .55})` }} />)}
      <svg className="jr-bath-hose" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <circle cx="91" cy="31" r="2" fill="#b9b3df" stroke="#555063" strokeWidth=".5" />
        <path d={`M91 31 C98 88 ${nozzle.x + 15} 94 ${nozzle.x} ${nozzle.y - 12}`} fill="none" stroke="#575266" strokeWidth="1.5" />
        <path d={`M91 31 C98 88 ${nozzle.x + 15} 94 ${nozzle.x} ${nozzle.y - 12}`} fill="none" stroke="#ccc8e4" strokeWidth=".8" strokeDasharray=".7 .4" />
      </svg>
      <button type="button" className="jr-bath-soap" aria-label={tr('Chai xà phòng', 'Soap bottle')} aria-describedby="jr-bath-help" disabled={done} style={{ left: `${soap.x}%`, top: `${soap.y}%` }} onPointerDown={(event) => start(event, 'soap')} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onBlur={stop} onKeyDown={(event) => keyboard(event, 'soap')}>
        <svg viewBox="0 0 100 160" aria-hidden="true"><g stroke="#30332e" strokeWidth="3.5" strokeLinejoin="round">
          <path d="M43 18h14v23H43z" fill="#d5d7d0" /><path d="M24 11Q48 4 76 11l7 7q1 6-7 5H24q-8 1-6-4z" fill="white" />
          <rect x="35" y="36" width="30" height="23" rx="5" fill="#eee" />
          <path d="M15 85Q15 56 50 56t35 29v53q0 15-35 15t-35-15z" fill="#a5db87" />
          <path d="M16 87h68v44H16z" fill="#ffffdf" />
          <path d="M50 102c-10-18-20 0-9 6-20 1-10 19 1 10-3 19 17 16 14 2 16 10 24-8 9-12 7-15-9-21-15-6z" fill="#eb78a6" />
          <circle cx="51" cy="111" r="5" fill="#f8e789" />
        </g></svg>
      </button>
      <div className={`jr-bath-shower${running ? ' is-running' : ''}`} style={{ left: `${nozzle.x}%`, top: `${nozzle.y}%` }}>
        <div className="jr-bath-water" aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <i key={i} style={{ '--i': i, '--delay': `${-i * .073}s` }} />)}</div>
        <button type="button" aria-label={tr('Vòi sen', 'Shower')} aria-pressed={running} aria-describedby="jr-bath-help" disabled={done} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={keyboard} onBlur={stop}>
          <svg viewBox="0 0 180 100" aria-hidden="true"><path d="M85 0h10v27l18 12H67l18-12z" fill="#aaa8ed" stroke="#45424e" strokeWidth="4" /><path d="M20 40Q90 30 160 40l15 10-38 32H43L5 50z" fill="#bcb8f3" stroke="#45424e" strokeWidth="4" /><path d="M10 51h160" stroke="#6b6696" strokeWidth="3" />{Array.from({ length: 9 }, (_, i) => <circle key={i} cx={42 + i * 12} cy={62 + i % 2 * 9} r="2" fill="#fbf3b8" />)}</svg>
        </button>
      </div>
      {done && <div className="jr-bath-success">✦ {tr('Jummo sạch thơm rồi!', 'Fresh and clean!')} ✦</div>}
    </div>
    <div className="jr-bath-controls">
      <p id="jr-bath-help">{tr('Kéo chai xà phòng quanh người Jummo để tạo bọt, rồi kéo vòi sen để rửa. Bàn phím: Tab chọn dụng cụ, phím mũi tên di chuyển, Enter bật/tắt nước.', 'Drag the soap bottle over Jummo, then rinse with the shower. Keyboard: Tab selects a tool, arrows move it, Enter toggles water.')}</p>
      <ShowerHead aria-hidden="true" />
    </div>
    <p role="status" className="jr-bath-status">{done ? tr('Tắm xong! Đã lưu chỉ số sạch sẽ cho Jummo.', 'Bath complete! Jummo’s cleanliness has been saved.') : soaped ? tr('Xối nước lên bọt để bọt tan dần nhé.', 'Rinse each foamy area until the bubbles dissolve.') : tr('Thêm một chút sữa tắm cho Jummo nào!', 'Let’s add some bubbles for Jummo!')}</p>
  </div>
}
