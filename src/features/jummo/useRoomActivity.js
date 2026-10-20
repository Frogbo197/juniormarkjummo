import { useEffect, useRef, useState } from 'react'
import { BED_PATH, HOME, travelDuration } from './roomScene'

function reducedMotion() {
  return document.documentElement.dataset.reduceMotion === 'true' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export default function useRoomActivity() {
  const [state, setState] = useState({ activity: 'idle', position: HOME, duration: 0, facing: 'left' })
  const current = useRef(state)
  const timer = useRef(null)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    function pause() {
      if (!document.hidden) return
      window.clearTimeout(timer.current)
      const idle = { activity: 'idle', position: HOME, duration: 0, facing: 'left' }
      current.current = idle; setState(idle)
    }
    document.addEventListener('visibilitychange', pause)
    return () => document.removeEventListener('visibilitychange', pause)
  }, [])

  function update(next) { current.current = next; setState(next) }

  function travel(path, activity, arrival) {
    window.clearTimeout(timer.current)
    if (reducedMotion()) {
      update({ ...current.current, activity: arrival, position: path.at(-1), duration: 0 })
      return
    }
    function step(index) {
      if (index === path.length) {
        timer.current = null
        update({ ...current.current, activity: arrival, duration: 0 })
        return
      }
      const position = path[index]
      const duration = travelDuration(current.current.position, position)
      update({ activity, position, duration, facing: position.x < current.current.position.x ? 'left' : 'right' })
      timer.current = window.setTimeout(() => step(index + 1), duration)
    }
    step(0)
  }

  function sleep() {
    if (['moving', 'returning', 'sleeping'].includes(current.current.activity)) return
    travel(BED_PATH, 'moving', 'sleeping')
  }
  function wake() {
    if (current.current.activity !== 'sleeping') return
    travel([...BED_PATH.slice(0, -1).reverse(), HOME], 'returning', 'idle')
  }
  function perform(activity) {
    if (['moving', 'returning', 'sleeping'].includes(current.current.activity)) return
    update({ ...current.current, activity, duration: 0 })
  }
  return { ...state, travelling: ['moving', 'returning'].includes(state.activity), occupied: ['moving', 'returning', 'sleeping'].includes(state.activity), sleep, wake, perform }
}
