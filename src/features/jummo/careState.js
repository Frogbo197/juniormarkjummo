import { useCallback, useEffect, useRef, useState } from 'react'
import { CARE_CONFIG as config } from './careConfig'

// Keep the key to migrate version 1 saves without losing progress.
export const CARE_KEY = 'jummo-care-v1'
export const DEFAULT_CARE = config.defaults
export const clampCare = (value) => Math.min(100, Math.max(0, value))
export function advanceCare(stats, elapsed, activity = 'idle', offline = false) {
  const duration = Math.max(0, elapsed)
  return Object.fromEntries(Object.keys(DEFAULT_CARE).map((key) => {
    let change = -config.decay[key] * duration / config.decayPeriodMs
    if (offline) change = Math.max(-config.offlineCap, change)
    else if (key === 'mood' && config.happyActivities.includes(activity)) change = config.moodReward.amount * duration / config.moodReward.periodMs
    else if (key === 'energy' && activity === 'sleeping') change = config.sleepReward.amount * duration / config.sleepReward.periodMs
    return [key, clampCare(stats[key] + change)]
  }))
}
export function loadCare(now = Date.now()) {
  try {
    const saved = JSON.parse(localStorage.getItem(CARE_KEY))
    if (![1, 2].includes(saved?.version) || !Object.keys(DEFAULT_CARE).every((key) => typeof saved.stats?.[key] === 'number' && Number.isFinite(saved.stats[key]))) throw new Error('Invalid save')
    const stats = Object.fromEntries(Object.keys(DEFAULT_CARE).map((key) => [key, clampCare(saved.stats[key])]))
    if (saved.version === 2 && (!Number.isFinite(saved.updatedAt) || saved.updatedAt < 0)) throw new Error('Invalid timestamp')
    const updatedAt = saved.version === 2 ? saved.updatedAt : now
    return { stats: advanceCare(stats, now - updatedAt, 'idle', true), updatedAt: Math.max(now, updatedAt) }
  } catch { return { stats: { ...DEFAULT_CARE }, updatedAt: now } }
}
export function readCare() { return loadCare().stats }
export function useCareState(activity = 'idle') {
  const [initial] = useState(() => loadCare())
  const [stats, setStats] = useState(initial.stats)
  const [saveError, setSaveError] = useState(false)
  const state = useRef({ ...initial, activity, hidden: document.hidden, savedAt: initial.updatedAt })
  const settle = useCallback((now = Date.now(), offline = state.current.hidden, publish = true) => {
    const current = state.current
    current.stats = advanceCare(current.stats, now - current.updatedAt, current.activity, offline)
    current.updatedAt = Math.max(current.updatedAt, now)
    if (publish) setStats(current.stats)
  }, [])
  const save = useCallback((publish = true) => {
    const current = state.current
    try {
      localStorage.setItem(CARE_KEY, JSON.stringify({ version: 2, stats: current.stats, updatedAt: current.updatedAt }))
      current.savedAt = current.updatedAt
      if (publish) setSaveError(false)
    } catch { if (publish) setSaveError(true) }
  }, [])
  useEffect(() => {
    // Settle the old activity before switching rates, including sub-second time.
    if (!state.current.hidden) settle()
    state.current.activity = activity
  }, [activity, settle])
  useEffect(() => {
    // This effect synchronizes the external save and reports storage failures.
    // oxlint-disable-next-line react/set-state-in-effect
    save()
    const interval = window.setInterval(() => {
      if (state.current.hidden) return
      settle()
      if (state.current.updatedAt - state.current.savedAt >= config.saveEveryMs) save()
    }, config.refreshMs)
    function visibility() {
      const current = state.current
      if (document.hidden === current.hidden) return
      // A hidden span settles once, so the cap applies to the entire absence.
      settle(Date.now(), current.hidden)
      current.hidden = document.hidden
      current.activity = 'idle'
      save()
    }
    function flush() {
      if (!state.current.hidden) settle(Date.now(), false, false)
      save(false)
    }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', flush)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [settle, save])
  function completeMeal(nutrition) {
    if (state.current.hidden || document.hidden || !Number.isFinite(nutrition) || nutrition <= 0) return 0
    settle()
    const current = state.current
    const fullness = clampCare(current.stats.fullness + nutrition)
    const gained = fullness - current.stats.fullness
    current.stats = { ...current.stats, fullness }
    setStats(current.stats); save()
    return gained
  }
  function completeBath() {
    if (state.current.hidden || document.hidden) return
    settle()
    const current = state.current
    current.stats = { ...current.stats, cleanliness: clampCare(current.stats.cleanliness + config.bathReward) }
    setStats(current.stats); save()
  }
  return { stats, completeMeal, completeBath, saveError }
}

