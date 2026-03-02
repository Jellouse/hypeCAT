import {
  CARD_SELECTION_SEED_STORAGE_KEY,
  MEMORY_SYMBOLS,
  MINI_PROMPTS_STORAGE_KEY,
  RADIO_SESSION_STORAGE_KEY,
  RADIO_STATIONS,
  RADIO_TUNE_THRESHOLD,
  SLOT_COOLDOWN_STORAGE_KEY,
} from './constants'
import type {
  Card,
  MemoryTile,
  PersistedRadioSessionByStation,
  RadioStation,
} from './types'

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export const encodePublicPath = (path: string) =>
  path
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

export const createMemoryTiles = (): MemoryTile[] => {
  const pool = [...MEMORY_SYMBOLS]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = pool[i]
    pool[i] = pool[j]
    pool[j] = temp
  }
  return pool.map((value, index) => ({ id: index, value, matched: false }))
}

export const shouldSkipCooldownPersistence = () => {
  if (typeof window === 'undefined' || !import.meta.env.DEV) {
    return false
  }
  const params = new URLSearchParams(window.location.search)
  return params.get('skipCooldownPersistence') === '1'
}

export const loadPersistedCooldowns = (): Record<number, number> => {
  if (typeof window === 'undefined' || shouldSkipCooldownPersistence()) {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(SLOT_COOLDOWN_STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const nowMs = Date.now()
    const next: Record<number, number> = {}
    Object.entries(parsed).forEach(([key, value]) => {
      const slotIndex = Number(key)
      if (!Number.isFinite(slotIndex) || typeof value !== 'number' || value <= nowMs) {
        return
      }
      next[slotIndex] = value
    })
    return next
  } catch {
    return {}
  }
}

export const loadPersistedRadioSessionState = (): PersistedRadioSessionByStation => {
  if (typeof window === 'undefined') {
    return {}
  }
  try {
    const raw = window.sessionStorage.getItem(RADIO_SESSION_STORAGE_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next: PersistedRadioSessionByStation = {}
    ;(['hype', 'night'] as const).forEach((stationId) => {
      const entry = parsed[stationId]
      if (!entry || typeof entry !== 'object') {
        return
      }
      const data = entry as Record<string, unknown>
      if (data.mode === 'uploads') {
        const uploadedTrackIndex = Number(data.uploadedTrackIndex)
        const uploadedTimeSec = Number(data.uploadedTimeSec)
        if (Number.isFinite(uploadedTrackIndex) && uploadedTrackIndex >= 0) {
          next[stationId] = {
            mode: 'uploads',
            uploadedTrackIndex,
            uploadedTimeSec: Number.isFinite(uploadedTimeSec) && uploadedTimeSec >= 0 ? uploadedTimeSec : 0,
          }
        }
        return
      }
      if (data.mode === 'synth') {
        const songIndex = Number(data.songIndex)
        const noteIndex = Number(data.noteIndex)
        if (Number.isFinite(songIndex) && Number.isFinite(noteIndex) && noteIndex >= 0) {
          next[stationId] = { mode: 'synth', songIndex, noteIndex }
        }
      }
    })
    return next
  } catch {
    return {}
  }
}

export const loadPersistedCards = (storageKey: string, fallback: Card[]): Card[] => {
  if (typeof window === 'undefined') {
    return [...fallback]
  }
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return [...fallback]
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return [...fallback]
    }
    const next = parsed.reduce<Card[]>((acc, item) => {
      if (!item || typeof item !== 'object') {
        return acc
      }
      const card = item as Partial<Card>
      if (typeof card.id !== 'string' || typeof card.tag !== 'string' || typeof card.title !== 'string' || typeof card.body !== 'string') {
        return acc
      }
      const paws =
        Array.isArray(card.paws) && typeof card.paws[0] === 'string' && typeof card.paws[1] === 'string'
          ? [card.paws[0], card.paws[1]]
          : ['/paw-green.png', '/paw-red.png']
      acc.push({ id: card.id, tag: card.tag, title: card.title, body: card.body, paws })
      return acc
    }, [])
    return next.length > 0 ? next : [...fallback]
  } catch {
    return [...fallback]
  }
}

export const hasPersistedCardDeck = (storageKey: string): boolean => {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(storageKey) !== null
  } catch {
    return false
  }
}

export const loadPersistedSelectionSeed = (): number => {
  if (typeof window === 'undefined') {
    return Math.floor(Math.random() * 1_000_000)
  }
  try {
    const raw = window.localStorage.getItem(CARD_SELECTION_SEED_STORAGE_KEY)
    if (raw) {
      const parsed = Number(raw)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
    const nextSeed = Math.floor(Math.random() * 1_000_000)
    window.localStorage.setItem(CARD_SELECTION_SEED_STORAGE_KEY, String(nextSeed))
    return nextSeed
  } catch {
    return Math.floor(Math.random() * 1_000_000)
  }
}

export const loadPersistedPrompts = (fallback: readonly string[]): string[] => {
  if (typeof window === 'undefined') {
    return [...fallback]
  }
  try {
    const raw = window.localStorage.getItem(MINI_PROMPTS_STORAGE_KEY)
    if (!raw) {
      return [...fallback]
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return [...fallback]
    }
    const next = parsed
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
    return next.length > 0 ? next : [...fallback]
  } catch {
    return [...fallback]
  }
}

export const shuffleCards = (cards: Card[]): Card[] => {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }
  return shuffled
}

export const normalizeCardCategories = (cards: Card[]): Card[] => {
  const correctedTagsById: Record<string, string> = {
    'card-4': 'PROMPT',
    'card-5': 'PROMPT',
    'card-12': 'PROMPT',
  }
  return cards.map((card) => {
    const correctedTag = correctedTagsById[card.id]
    return correctedTag ? { ...card, tag: correctedTag } : card
  })
}

export const stationById = (stationId: RadioStation['id'] | null) =>
  stationId ? (RADIO_STATIONS.find((station) => station.id === stationId) ?? null) : null

export const nearestStationForPosition = (position: number): RadioStation | null => {
  const best = RADIO_STATIONS.reduce<{ station: RadioStation; distance: number } | null>((currentBest, station) => {
    const distance = Math.abs(station.position - position)
    if (!currentBest || distance < currentBest.distance) {
      return { station, distance }
    }
    return currentBest
  }, null)
  if (!best || best.distance > RADIO_TUNE_THRESHOLD) {
    return null
  }
  return best.station
}

export const radioWavePath = (() => {
  const width = 900
  const height = 44
  const centerY = height / 2
  const points = 180
  const baseAmplitude = 2
  const stationReach = 0.13
  let path = ''
  for (let i = 0; i <= points; i += 1) {
    const normalizedX = i / points
    const x = normalizedX * width
    let amplitude = baseAmplitude
    RADIO_STATIONS.forEach((station) => {
      const distance = Math.abs(normalizedX - station.position)
      if (distance < stationReach) {
        amplitude += (1 - distance / stationReach) * 9
      }
    })
    const wave = Math.sin(normalizedX * Math.PI * 48)
    const y = centerY + wave * amplitude
    path += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return path
})()

export const midiToFrequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

export const resolveWeatherVisual = (weatherCode: number, isDay: boolean): { iconSrc: string; label: string } => {
  if (weatherCode === 0) {
    return isDay ? { iconSrc: '/ui-sun.png', label: 'Clear sky' } : { iconSrc: '/ui-sun.png', label: 'Clear night' }
  }
  if (weatherCode === 1) {
    return isDay ? { iconSrc: '/ui-sun.png', label: 'Mostly clear' } : { iconSrc: '/ui-sun.png', label: 'Mostly clear night' }
  }
  if (weatherCode === 2) {
    return { iconSrc: '/ui-sun.png', label: 'Partly cloudy' }
  }
  if (weatherCode === 3) {
    return { iconSrc: '/ui-sun.png', label: 'Overcast' }
  }
  if ([45, 48].includes(weatherCode)) {
    return { iconSrc: '/ui-sun.png', label: 'Foggy' }
  }
  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return { iconSrc: '/ui-sun.png', label: 'Drizzle' }
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return { iconSrc: '/ui-sun.png', label: 'Rain' }
  }
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return { iconSrc: '/ui-sun.png', label: 'Snow' }
  }
  if ([95, 96, 99].includes(weatherCode)) {
    return { iconSrc: '/ui-sun.png', label: 'Thunderstorm' }
  }
  return { iconSrc: '/ui-sun.png', label: 'Weather unavailable' }
}
