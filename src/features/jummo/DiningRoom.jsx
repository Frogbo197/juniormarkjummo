import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { t as tr } from '../../i18n/language'
import CarePanel from './CarePanel'
import { DINING, FOODS, isAtMouth } from './diningScene'

function FoodArt({ food }) {
  return <img className="jr-table-food-art" draggable="false" src={food.src} alt="" />
}

export default function DiningRoom({ stats, completeMeal, onBack, onBusyChange }) {
  const [phase, setPhase] = useState('idle')
  const [selected, setSelected] = useState(null)
  const [drag, setDrag] = useState(null)
  const [message, setMessage] = useState('')
  const [mealId, setMealId] = useState(0)
  const [mealFood, setMealFood] = useState(null)
  const [mobile, setMobile] = useState(() => window.matchMedia?.(`(max-width: ${DINING.table.breakpoint}px)`).matches || false)
  const [page, setPage] = useState(0)
  const visibleFoods = mobile ? Array.from({ length: 3 }, (_, i) => FOODS[(page + i) % FOODS.length]) : FOODS
  const scene = useRef(null), pointer = useRef(null), timer = useRef(null), eating = useRef(false)
  const full = stats.fullness >= 100
  const mouthOpen = phase === 'dragging' || phase === 'mouth'
  const busyCallback = useRef(onBusyChange)
  useEffect(() => { busyCallback.current = onBusyChange }, [onBusyChange])
  useEffect(() => () => { window.clearTimeout(timer.current) }, [])
  useEffect(() => {
    const media = window.matchMedia?.(`(max-width: ${DINING.table.breakpoint}px)`)
    function resize() {
      pointer.current = null; setDrag(null)
      if (!eating.current) setPhase('idle')
      setMobile(media.matches)
    }
    media?.addEventListener?.('change', resize)
    return () => media?.removeEventListener?.('change', resize)
  }, [])
  useEffect(() => {
    function cancelInterrupted() {
      if (document.hidden && eating.current) {
        window.clearTimeout(timer.current); timer.current = null; eating.current = false
        busyCallback.current(false); setPhase('idle'); setMealFood(null); setMessage('')
      }
      if (!pointer.current) return
      pointer.current = null; setDrag(null); setPhase('idle')
    }
    window.addEventListener('blur', cancelInterrupted)
    document.addEventListener('visibilitychange', cancelInterrupted)
    return () => {
      window.removeEventListener('blur', cancelInterrupted)
      document.removeEventListener('visibilitychange', cancelInterrupted)
    }
  }, [])
  function feed(food) {
    if (!food || eating.current) return
    if (full) { setMessage(tr('Jummo no rồi!', 'Jummo is full!')); return }
    eating.current = true
    setMealFood(food.id)
    onBusyChange(true)
    setDrag(null); setPhase('eating'); setMessage(''); setMealId((id) => id + 1)
    timer.current = window.setTimeout(() => {
      timer.current = null
      const gained = completeMeal(food.nutrition)
      eating.current = false; onBusyChange(false); setPhase('idle'); setMealFood(null)
      setMessage(tr(`+${Math.round(gained)} no bụng`, `+${Math.round(gained)} fullness`))
    }, DINING.mealDuration)
  }
  function startDrag(event, food) {
    if (eating.current || full || pointer.current || event.button !== 0 || event.isPrimary === false) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointer.current = { id: event.pointerId, food }
    setSelected(food); setMessage(''); setPhase('dragging')
    setDrag({ food, x: event.clientX, y: event.clientY })
  }
  function moveDrag(event) {
    const active = pointer.current
    if (!active || active.id !== event.pointerId) return
    setDrag({ food: active.food, x: event.clientX, y: event.clientY })
    setPhase(isAtMouth(event.clientX, event.clientY, scene.current?.getBoundingClientRect()) ? 'mouth' : 'dragging')
  }
  function endDrag(event, cancelled = false) {
    const active = pointer.current
    if (!active || active.id !== event.pointerId) return
    pointer.current = null; setDrag(null); setPhase('idle')
    if (!cancelled && isAtMouth(event.clientX, event.clientY, scene.current?.getBoundingClientRect())) feed(active.food)
  }
  return <div className="jr-dining jr-room-card" data-phase={phase}>
    <div className="jr-scene-toolbar"><span>{tr('Bữa ngon cùng Jummo', 'A meal with Jummo')}</span><button type="button" className="jr-primary-button" disabled={phase === 'eating'} onClick={onBack}>{tr('Về phòng', 'Back to room')}</button></div>
    <div className="jr-care-scene">
      <CarePanel stats={stats} />
      <div ref={scene} className="jr-dining-scene" data-testid="dining-scene">
        <img key={phase === 'eating' ? mealId : mouthOpen ? 'mouth' : 'idle'} className="jr-dining-art" draggable="false" src={phase === 'eating' ? DINING.art.eating : mouthOpen ? DINING.art.mouth : DINING.art.idle} alt={phase === 'eating' ? tr('Jummo đang ăn', 'Jummo eating') : mouthOpen ? tr('Jummo mở miệng', 'Jummo opens mouth') : tr('Jummo trong phòng ăn', 'Jummo in the dining room')} />
        {import.meta.env.DEV && DINING.debugMouth && <div className="jr-mouth-debug" style={{ left: `${DINING.mouth.x * 100}%`, top: `${DINING.mouth.y * 100}%`, width: `${DINING.mouth.width * 100}%`, height: `${DINING.mouth.height * 100}%` }} />}
      <div className="jr-table-foods" role="group" aria-label={tr('Món ăn trên bàn', 'Food on the table')}>
      {visibleFoods.map((food, index) => <button type="button" key={food.id} aria-label={`${tr(food.vi, food.en)} +${food.nutrition}`} title={tr(food.vi, food.en)} aria-pressed={selected?.id === food.id} disabled={phase === 'eating' || full} style={{ left: `${(mobile ? DINING.table.mobileX : DINING.table.desktopX)[index] * 100}%`, top: `${DINING.table.y * 100}%` }} className={`jr-table-food${drag?.food.id === food.id || mealFood === food.id ? ' is-away' : ''}`} onClick={() => { if (!eating.current) setSelected(food) }} onPointerDown={(event) => startDrag(event, food)} onPointerMove={moveDrag} onPointerUp={(event) => endDrag(event)} onPointerCancel={(event) => endDrag(event, true)} onLostPointerCapture={(event) => endDrag(event, true)}>
        <span className="jr-food-plate" aria-hidden="true" /><FoodArt food={food} /><span className="jr-table-food-name">{tr(food.vi, food.en)}</span>
      </button>)}
      </div>
      {mobile && <><button className="jr-table-arrow is-previous" type="button" aria-label={tr('Món trước', 'Previous foods')} disabled={!!drag || phase === 'eating'} onClick={() => { setPage((p) => (p + FOODS.length - 1) % FOODS.length); setSelected(null) }}><ChevronLeft size={18} /></button><button className="jr-table-arrow is-next" type="button" aria-label={tr('Món tiếp', 'Next foods')} disabled={!!drag || phase === 'eating'} onClick={() => { setPage((p) => (p + 1) % FOODS.length); setSelected(null) }}><ChevronRight size={18} /></button></>}
      </div>
    </div>
    <div className="jr-table-footer">
      <p role="status" aria-live="polite">{phase === 'eating' ? tr('Jummo đang ăn…', 'Jummo is eating…') : full ? [message, tr('Jummo no rồi!', 'Jummo is full!')].filter(Boolean).join(' · ') : message || tr('Kéo món trên bàn tới miệng Jummo.', 'Drag a dish from the table to Jummo’s mouth.')}</p>
      {selected && <button type="button" className="jr-primary-button" disabled={full || phase === 'eating' || !!drag} onClick={() => feed(selected)}>{tr('Cho ăn', 'Feed')}</button>}
    </div>
    {drag && <div className="jr-drag-food" aria-hidden="true" style={{ left: drag.x, top: drag.y, width: DINING.dragSize, height: DINING.dragSize, '--food-size': `${DINING.dragSize}px` }}><FoodArt food={drag.food} /></div>}
  </div>
}

