import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import './index.css'

type Card = {
  id: string
  tag: string
  title: string
  body: string
  paws: string[]
}

const PAW_SETS = {
  greenRed: ['/paw-green.png', '/paw-red.png'],
  redGreen: ['/paw-red.png', '/paw-green.png'],
}

const CARDS: Card[] = [
  {
    id: 'card-1',
    tag: 'BODY\nRESET',
    title: 'SHOULDER ROLL',
    body: 'ROLL YOUR SHOULDERS BACK 8 TIMES, THEN FORWARD 8 TIMES.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-2',
    tag: 'BODY\nRESET',
    title: 'WRIST WAKE',
    body: 'DRAW SLOW CIRCLES WITH BOTH WRISTS FOR 20 SECONDS.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-3',
    tag: 'BODY\nRESET',
    title: 'POSTURE CHECK',
    body: 'PLANT FEET, RELAX JAW, LENGTHEN SPINE FOR 3 BREATHS.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-4',
    tag: 'PROMPT',
    title: 'COLOR SCAN',
    body: 'NAME 3 BLUE THINGS YOU CAN SEE RIGHT NOW.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-5',
    tag: 'PROMPT',
    title: 'MICRO GRATITUDE',
    body: 'WRITE ONE TINY WIN FROM TODAY IN FIVE WORDS.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-6',
    tag: 'MIND\nSNACK',
    title: 'FOCUS RESET',
    body: 'CLOSE EYES FOR 10 SECONDS AND LISTEN FOR ONE SOUND.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-7',
    tag: 'STATUS\nNUDGE',
    title: 'WATER CHECK',
    body: 'TAKE 3 SIPS OF WATER AND MARK HYDRATION AS DONE.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-8',
    tag: 'STATUS\nNUDGE',
    title: 'TAB TIDY',
    body: 'CLOSE 2 UNUSED TABS TO LIGHTEN YOUR BRAIN BUFFER.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-9',
    tag: 'STATUS\nNUDGE',
    title: 'NEXT ACTION',
    body: 'WRITE THE NEXT 1 CONCRETE STEP FOR YOUR CURRENT TASK.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-10',
    tag: 'BODY\nRESET',
    title: 'NECK SOFTEN',
    body: 'TILT EAR TO SHOULDER LEFT/RIGHT AND BREATHE SLOWLY.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-11',
    tag: 'BODY\nRESET',
    title: 'ANKLE LOOP',
    body: 'LIFT FEET AND DRAW 8 CIRCLES WITH EACH ANKLE.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-12',
    tag: 'PROMPT',
    title: 'TINY POEM',
    body: 'WRITE A 3-WORD POEM ABOUT YOUR CURRENT MOOD.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-13',
    tag: 'MIND\nSNACK',
    title: 'COUNTDOWN CALM',
    body: 'COUNT 5-4-3-2-1 THINGS YOU SENSE RIGHT NOW.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-14',
    tag: 'STATUS\nNUDGE',
    title: 'DESK RESET',
    body: 'PUT 1 ITEM BACK IN ITS HOME SPOT.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'card-15',
    tag: 'STATUS\nNUDGE',
    title: 'PING FRIEND',
    body: 'SEND A KIND 1-LINE CHECK-IN TO SOMEONE.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
]

const MINI_ARCADE_CARDS: Card[] = [
  {
    id: 'arcade-pong',
    tag: 'ARCADE\nPONG',
    title: 'MINI PONG',
    body: 'Tiny rally. Keep the pixel ball alive.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'arcade-flappy',
    tag: 'ARCADE\nFLAP',
    title: 'MINI FLAPPY',
    body: 'Tap or press to dodge tiny pipes.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'arcade-memory',
    tag: 'ARCADE\nMEM',
    title: 'MINI MEMORY',
    body: 'Match pairs and clear the tiny grid.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
]

const MINI_PROMPT_CARDS: Card[] = [
  {
    id: 'prompt-pong',
    tag: 'PROMPT\nPONG',
    title: 'TINY PROMPT',
    body: 'Quick reflection while you rally.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'prompt-flappy',
    tag: 'PROMPT\nFLAP',
    title: 'TINY PROMPT',
    body: 'One-line thought between taps.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
  {
    id: 'prompt-memory',
    tag: 'PROMPT\nMEM',
    title: 'TINY PROMPT',
    body: 'Capture one tiny insight.',
    paws: ['/paw-green.png', '/paw-red.png'],
  },
]

type RadioSong = {
  title: string
  bpm: number
  notes: Array<number | null>
}

type UploadedTune = {
  title: string
  file: string
}

type UploadedTunesByStation = Record<RadioStation['id'], UploadedTune[]>

type RadioStation = {
  id: 'hype' | 'night'
  name: string
  position: number
  songIndexes: number[]
  allowsUploads: boolean
}

type PersistedStationRadioState =
  | { mode: 'uploads'; uploadedTrackIndex: number; uploadedTimeSec: number }
  | { mode: 'synth'; songIndex: number; noteIndex: number }

type PersistedRadioSessionByStation = Partial<Record<RadioStation['id'], PersistedStationRadioState>>

type WeatherSnapshot = {
  iconSrc: string
  label: string
  temperatureC: number | null
}

type CardSlot = {
  card: Card | null
  cooldownUntil: number | null
}

type MemoryTile = {
  id: number
  value: string
  matched: boolean
}

type MiniCardId = 'pong' | 'flappy' | 'memory'

const CARD_SLOT_COUNT = 3
const VOTED_SLOT_COOLDOWN_MS = 20 * 60 * 1000
const CARDS_STORAGE_KEY = 'hypecat.cards'
const MINI_ARCADE_CARDS_STORAGE_KEY = 'hypecat.miniArcadeCards'
const MINI_PROMPTS_STORAGE_KEY = 'hypecat.miniPrompts'
const SLOT_COOLDOWN_STORAGE_KEY = 'hypecat.slotCooldownUntil'
const RADIO_SESSION_STORAGE_KEY = 'hypecat.radioSession'
const MEMORY_SYMBOLS = ['P', 'P', 'C', 'C', 'R', 'R', 'M', 'M'] as const
const MINI_PROMPTS = [
  'What is one tiny win from today?',
  'What would make the next 10 minutes easier?',
  'Name one thing you can simplify right now.',
  'What is your next concrete action?',
  'What are you curious about in this task?',
  'What would future-you thank you for?',
] as const

const RADIO_LIBRARY: RadioSong[] = [
  {
    title: 'Moonbeam Loop',
    bpm: 118,
    notes: [64, 67, 71, 72, 71, 67, 64, null, 64, 67, 71, 74, 72, 71, 67, null],
  },
  {
    title: 'Paws In Orbit',
    bpm: 104,
    notes: [57, 60, 64, 69, 67, 64, 60, null, 57, 60, 65, 69, 67, 65, 60, null],
  },
  {
    title: 'Night Byte FM',
    bpm: 126,
    notes: [60, 62, 65, 69, 67, 65, 62, null, 60, 62, 65, 71, 69, 67, 65, null],
  },
]

const RADIO_STATIONS: RadioStation[] = [
  { id: 'hype', name: 'HYPE FM', position: 0.2, songIndexes: [0, 1], allowsUploads: true },
  { id: 'night', name: 'NITE FM', position: 0.78, songIndexes: [2], allowsUploads: false },
]
const RADIO_TUNE_THRESHOLD = 0.065

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const encodePublicPath = (path: string) =>
  path
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/')

const createMemoryTiles = (): MemoryTile[] => {
  const pool = [...MEMORY_SYMBOLS]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = pool[i]
    pool[i] = pool[j]
    pool[j] = temp
  }
  return pool.map((value, index) => ({ id: index, value, matched: false }))
}

const shouldSkipCooldownPersistence = () => {
  if (typeof window === 'undefined' || !import.meta.env.DEV) {
    return false
  }
  const params = new URLSearchParams(window.location.search)
  return params.get('skipCooldownPersistence') === '1'
}

const loadPersistedCooldowns = (): Record<number, number> => {
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

const loadPersistedRadioSessionState = (): PersistedRadioSessionByStation => {
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

const loadPersistedCards = (storageKey: string, fallback: Card[]): Card[] => {
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
          : [...PAW_SETS.greenRed]
      acc.push({ id: card.id, tag: card.tag, title: card.title, body: card.body, paws })
      return acc
    }, [])
    return next.length > 0 ? next : [...fallback]
  } catch {
    return [...fallback]
  }
}

const loadPersistedPrompts = (fallback: readonly string[]): string[] => {
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

const shuffleCards = (cards: Card[]): Card[] => {
  const shuffled = [...cards]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }
  return shuffled
}

const normalizeCardCategories = (cards: Card[]): Card[] => {
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

const stationById = (stationId: RadioStation['id'] | null) =>
  stationId ? (RADIO_STATIONS.find((station) => station.id === stationId) ?? null) : null

const nearestStationForPosition = (position: number): RadioStation | null => {
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

const radioWavePath = (() => {
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

const midiToFrequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

const resolveWeatherVisual = (weatherCode: number, isDay: boolean): { iconSrc: string; label: string } => {
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

function App() {
  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const
  const [isCute, setIsCute] = useState(true)
  const [isCuteCollapsed, setIsCuteCollapsed] = useState(false)
  const [cards, setCards] = useState<Card[]>(() =>
    shuffleCards(normalizeCardCategories(loadPersistedCards(CARDS_STORAGE_KEY, CARDS))),
  )
  const [miniArcadeCards, setMiniArcadeCards] = useState<Card[]>(() =>
    loadPersistedCards(MINI_ARCADE_CARDS_STORAGE_KEY, MINI_ARCADE_CARDS),
  )
  const [miniPrompts, setMiniPrompts] = useState<string[]>(() => loadPersistedPrompts(MINI_PROMPTS))
  const [lastCardIdBySlot, setLastCardIdBySlot] = useState<Record<number, string>>({})
  const [votes, setVotes] = useState<Record<string, -1 | 0 | 1>>({})
  const [removingCardId, setRemovingCardId] = useState<string | null>(null)
  const [removalDirection, setRemovalDirection] = useState<-1 | 1 | null>(null)
  const [slotCooldownUntil, setSlotCooldownUntil] = useState<Record<number, number>>(() => loadPersistedCooldowns())
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [newTag, setNewTag] = useState('BODY\nRESET')
  const [newTitle, setNewTitle] = useState('REACTION TEST')
  const [newBody, setNewBody] = useState('TAP YOUR DESK 5 TIMES AS EVENLY AS POSSIBLE.')
  const [isRadioOn, setIsRadioOn] = useState(false)
  const [isTuning, setIsTuning] = useState(false)
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null)
  const [currentTrackLabel, setCurrentTrackLabel] = useState('')
  const [radioSessionByStation, setRadioSessionByStation] = useState<PersistedRadioSessionByStation>(() =>
    loadPersistedRadioSessionState(),
  )
  const [uploadedTunesByStation, setUploadedTunesByStation] = useState<UploadedTunesByStation>({
    hype: [],
    night: [],
  })
  const [tunerPosition, setTunerPosition] = useState(RADIO_STATIONS[0].position)
  const [activeStationId, setActiveStationId] = useState<RadioStation['id'] | null>(RADIO_STATIONS[0].id)
  const [isTunerDragging, setIsTunerDragging] = useState(false)
  const [weather, setWeather] = useState<WeatherSnapshot>({
    iconSrc: '/ui-sun.png',
    label: 'Weather unavailable',
    temperatureC: null,
  })
  const [now, setNow] = useState(() => new Date())
  const [isBatteryPanelOpen, setIsBatteryPanelOpen] = useState(false)
  const [isTouchOptimized, setIsTouchOptimized] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 760px)').matches : false,
  )
  const [pongScore, setPongScore] = useState({ player: 0, cpu: 0 })
  const [flappyScore, setFlappyScore] = useState(0)
  const [flappyBest, setFlappyBest] = useState(0)
  const [flappyPhase, setFlappyPhase] = useState<'ready' | 'running' | 'over'>('ready')
  const [memoryTiles, setMemoryTiles] = useState<MemoryTile[]>(() => createMemoryTiles())
  const [memoryOpenIds, setMemoryOpenIds] = useState<number[]>([])
  const [memoryMoves, setMemoryMoves] = useState(0)
  const [memoryWins, setMemoryWins] = useState(0)
  const [memoryBusy, setMemoryBusy] = useState(false)
  const [miniPromptIndexes, setMiniPromptIndexes] = useState<Record<MiniCardId, number>>({
    pong: 0,
    flappy: 1,
    memory: 2,
  })
  const [miniPromptDrafts, setMiniPromptDrafts] = useState<Record<MiniCardId, string>>({
    pong: '',
    flappy: '',
    memory: '',
  })
  const [miniPromptFeedback, setMiniPromptFeedback] = useState<Record<MiniCardId, string>>({
    pong: '',
    flappy: '',
    memory: '',
  })
  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const crackleSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const crackleGainRef = useRef<GainNode | null>(null)
  const crackleTimerRef = useRef<number | null>(null)
  const noteTimerRef = useRef<number | null>(null)
  const tuneTimerRef = useRef<number | null>(null)
  const radioOnRef = useRef(false)
  const songIndexRef = useRef(0)
  const noteIndexRef = useRef(0)
  const uploadedIndexRef = useRef(0)
  const uploadedLibrarySigRef = useRef('')
  const currentPlaybackStationIdRef = useRef<RadioStation['id'] | null>(null)
  const slotCooldownTimersRef = useRef<Record<number, number>>({})
  const tunerTrackRef = useRef<HTMLDivElement | null>(null)
  const activeStationIdRef = useRef<RadioStation['id'] | null>(RADIO_STATIONS[0].id)
  const batteryPanelRef = useRef<HTMLDivElement | null>(null)
  const pongCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const flappyCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pongCanvasVersion, setPongCanvasVersion] = useState(0)
  const [flappyCanvasVersion, setFlappyCanvasVersion] = useState(0)
  const pongMoveDirectionRef = useRef<-1 | 0 | 1>(0)
  const flappyActionRef = useRef(false)
  const memoryHideTimerRef = useRef<number | null>(null)

  const setPongCanvasNode = useCallback((node: HTMLCanvasElement | null) => {
    if (pongCanvasRef.current !== node) {
      pongCanvasRef.current = node
      setPongCanvasVersion((version) => version + 1)
    }
  }, [])

  const setFlappyCanvasNode = useCallback((node: HTMLCanvasElement | null) => {
    if (flappyCanvasRef.current !== node) {
      flappyCanvasRef.current = node
      setFlappyCanvasVersion((version) => version + 1)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (shouldSkipCooldownPersistence()) {
      window.localStorage.removeItem(SLOT_COOLDOWN_STORAGE_KEY)
      return
    }
    try {
      window.localStorage.setItem(SLOT_COOLDOWN_STORAGE_KEY, JSON.stringify(slotCooldownUntil))
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  }, [slotCooldownUntil])

  useEffect(() => {
    setSlotCooldownUntil((prev) => {
      const nowMs = Date.now()
      const next = Object.entries(prev).reduce<Record<number, number>>((acc, [key, value]) => {
        if (value > nowMs) {
          acc[Number(key)] = value
        }
        return acc
      }, {})
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
  }, [now])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards))
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  }, [cards])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(MINI_ARCADE_CARDS_STORAGE_KEY, JSON.stringify(miniArcadeCards))
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  }, [miniArcadeCards])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.localStorage.setItem(MINI_PROMPTS_STORAGE_KEY, JSON.stringify(miniPrompts))
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  }, [miniPrompts])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      window.sessionStorage.setItem(RADIO_SESSION_STORAGE_KEY, JSON.stringify(radioSessionByStation))
    } catch {
      // Ignore storage failures (private mode / quota).
    }
  }, [radioSessionByStation])

  useEffect(() => {
    let mounted = true

    const getCoords = () =>
      new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation unavailable'))
          return
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          () => reject(new Error('Geolocation denied')),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 },
        )
      })

    const loadWeather = async () => {
      try {
        const { latitude, longitude } = await getCoords()
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day&timezone=auto`,
          { cache: 'no-store' },
        )
        if (!response.ok) {
          throw new Error(`Weather request failed with status ${response.status}`)
        }
        const json = (await response.json()) as {
          current?: { temperature_2m?: number; weather_code?: number; is_day?: number }
        }
        const weatherCode = Number(json.current?.weather_code)
        const isDay = Number(json.current?.is_day) === 1
        const nextTemp = Number(json.current?.temperature_2m)
        const visual = resolveWeatherVisual(weatherCode, isDay)
        if (mounted) {
          setWeather({
            ...visual,
            temperatureC: Number.isFinite(nextTemp) ? nextTemp : null,
          })
        }
      } catch {
        if (mounted) {
          setWeather((prev) => ({
            ...prev,
            label: 'Weather unavailable (enable location)',
            temperatureC: null,
          }))
        }
      }
    }

    void loadWeather()
    const refreshId = window.setInterval(() => {
      void loadWeather()
    }, 10 * 60 * 1000)

    return () => {
      mounted = false
      window.clearInterval(refreshId)
    }
  }, [])

  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateLabel = now.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })
  const monthYearLabel = now.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })
  const weatherTemperatureLabel = weather.temperatureC === null ? '--°C' : `${Math.round(weather.temperatureC)}°C`
  const activeStation = stationById(activeStationId)
  const activeStationUploadedTunes = activeStation ? uploadedTunesByStation[activeStation.id] ?? [] : []
  const dayOfWeek = now.getDay()
  const hourFloat = now.getHours() + now.getMinutes() / 60
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const clampPercent = (value: number) => Math.round(Math.max(5, Math.min(100, value)))
  const meterWidth = (value: number) => `${Math.max(6, Math.min(100, value))}%`
  const socialBattery = (() => {
    if (hourFloat < 6) {
      return clampPercent(84 + (6 - hourFloat) * 2.5)
    }
    const startLevel = isWeekend ? 96 : 86
    const hourlyDrain = isWeekend ? 2.4 : 3.7
    return clampPercent(startLevel - (hourFloat - 6) * hourlyDrain)
  })()
  const sleepBattery = (() => {
    const wakePoint = 7
    const hoursAwake = (hourFloat - wakePoint + 24) % 24
    return clampPercent(98 - hoursAwake * 3.2)
  })()
  const attentionBattery = (() => {
    if (isWeekend) {
      return clampPercent(90 + Math.cos((hourFloat / 24) * Math.PI * 2) * 4)
    }
    if (hourFloat >= 9 && hourFloat < 17.5) {
      return 58
    }
    if (hourFloat >= 17.5 && hourFloat < 23) {
      return 80
    }
    return 69
  })()

  useEffect(() => {
    if (!isBatteryPanelOpen) {
      return
    }
    const closeIfOutside = (event: MouseEvent) => {
      if (!batteryPanelRef.current?.contains(event.target as Node)) {
        setIsBatteryPanelOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsBatteryPanelOpen(false)
      }
    }
    window.addEventListener('mousedown', closeIfOutside)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('mousedown', closeIfOutside)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [isBatteryPanelOpen])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const media = window.matchMedia('(max-width: 760px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsTouchOptimized(event.matches)
    }
    setIsTouchOptimized(media.matches)
    media.addEventListener('change', handleChange)
    return () => {
      media.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    const canvas = pongCanvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const width = isTouchOptimized ? 220 : 146
    const height = isTouchOptimized ? 138 : 88
    canvas.width = width
    canvas.height = height

    let playerY = height / 2 - 12
    let cpuY = height / 2 - 12
    let ballX = width / 2
    let ballY = height / 2
    let velX = (Math.random() > 0.5 ? 1 : -1) * (isTouchOptimized ? 2.2 : 1.8)
    let velY = (Math.random() * 1.4 - 0.7) * (isTouchOptimized ? 1.4 : 1)
    const paddleHeight = isTouchOptimized ? 34 : 26
    const paddleWidth = 5
    const leftX = 7
    const rightX = width - 12
    let frameId = 0
    let lastAt = performance.now()
    let localScore = { player: 0, cpu: 0 }

    setPongScore({ player: 0, cpu: 0 })

    const resetBall = (towardPlayer: boolean) => {
      ballX = width / 2
      ballY = height / 2
      velX = (towardPlayer ? -1 : 1) * (isTouchOptimized ? 2.1 : 1.7)
      velY = (Math.random() * 1.6 - 0.8) * (isTouchOptimized ? 1.4 : 1)
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const y = event.clientY - rect.top
      playerY = Math.max(0, Math.min(height - paddleHeight, y - paddleHeight / 2))
    }
    canvas.addEventListener('pointermove', onPointerMove)

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#e8edf4'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#8ca0b6'
      for (let y = 0; y < height; y += 10) {
        ctx.fillRect(width / 2 - 1, y, 2, 5)
      }

      ctx.fillStyle = '#33475d'
      ctx.fillRect(leftX, playerY, paddleWidth, paddleHeight)
      ctx.fillRect(rightX, cpuY, paddleWidth, paddleHeight)
      ctx.fillRect(ballX - 2, ballY - 2, 4, 4)
    }

    const tick = (nowAt: number) => {
      const dt = Math.min(33, nowAt - lastAt) / 16.6
      lastAt = nowAt

      playerY += pongMoveDirectionRef.current * (isTouchOptimized ? 2.6 : 2.1) * dt
      playerY = Math.max(0, Math.min(height - paddleHeight, playerY))

      const cpuTarget = ballY - paddleHeight / 2
      cpuY += Math.sign(cpuTarget - cpuY) * (isTouchOptimized ? 1.7 : 1.4) * dt
      cpuY = Math.max(0, Math.min(height - paddleHeight, cpuY))

      ballX += velX * dt
      ballY += velY * dt

      if (ballY <= 2 || ballY >= height - 2) {
        velY *= -1
      }

      const hitsPlayer =
        ballX <= leftX + paddleWidth + 2 && ballX >= leftX && ballY >= playerY && ballY <= playerY + paddleHeight
      const hitsCpu = ballX >= rightX - 2 && ballX <= rightX + paddleWidth && ballY >= cpuY && ballY <= cpuY + paddleHeight

      if (hitsPlayer && velX < 0) {
        velX = Math.abs(velX) * 1.03
      }
      if (hitsCpu && velX > 0) {
        velX = -Math.abs(velX) * 1.03
      }

      if (ballX < -8) {
        localScore = { ...localScore, cpu: localScore.cpu + 1 }
        setPongScore(localScore)
        resetBall(false)
      } else if (ballX > width + 8) {
        localScore = { ...localScore, player: localScore.player + 1 }
        setPongScore(localScore)
        resetBall(true)
      }

      draw()
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      window.cancelAnimationFrame(frameId)
      pongMoveDirectionRef.current = 0
    }
  }, [isTouchOptimized, pongCanvasVersion])

  useEffect(() => {
    const canvas = flappyCanvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const width = isTouchOptimized ? 220 : 146
    const height = isTouchOptimized ? 138 : 88
    canvas.width = width
    canvas.height = height

    type Pipe = { x: number; gapTop: number; passed: boolean }
    const gapSize = isTouchOptimized ? 68 : 50
    const pipeWidth = isTouchOptimized ? 14 : 10
    const birdX = isTouchOptimized ? 48 : 32
    const flapImpulse = isTouchOptimized ? -2.05 : -1.72
    const gravity = isTouchOptimized ? 0.082 : 0.067
    let birdY = height / 2
    let velY = 0
    let pipes: Pipe[] = []
    let frame = 0
    let score = 0
    let phase: 'ready' | 'running' | 'over' = 'ready'
    let rafId = 0

    setFlappyScore(0)
    setFlappyPhase('ready')

    const reset = () => {
      birdY = height / 2
      velY = 0
      pipes = []
      frame = 0
      score = 0
      phase = 'ready'
      setFlappyScore(0)
      setFlappyPhase('ready')
    }

    const flap = () => {
      if (phase === 'over') {
        reset()
        return
      }
      if (phase === 'ready') {
        phase = 'running'
        setFlappyPhase('running')
      }
      velY = flapImpulse
    }

    const fail = () => {
      if (phase === 'over') {
        return
      }
      phase = 'over'
      setFlappyPhase('over')
      setFlappyBest((prev) => Math.max(prev, score))
    }

    const onPointerDown = () => {
      flap()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault()
        flap()
      }
    }
    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#dbe5f0'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#9cb3cb'
      ctx.fillRect(0, height - 10, width, 10)

      ctx.fillStyle = '#4f6781'
      pipes.forEach((pipe) => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapTop)
        ctx.fillRect(pipe.x, pipe.gapTop + gapSize, pipeWidth, height - pipe.gapTop - gapSize - 10)
      })

      ctx.fillStyle = '#29394d'
      ctx.fillRect(birdX - 3, birdY - 3, 7, 7)

      if (phase === 'ready') {
        ctx.fillStyle = '#51657d'
        ctx.font = `${isTouchOptimized ? 11 : 9}px monospace`
        ctx.fillText('TAP', width / 2 - 12, height / 2 - 14)
      }
      if (phase === 'over') {
        ctx.fillStyle = '#51657d'
        ctx.font = `${isTouchOptimized ? 11 : 9}px monospace`
        ctx.fillText('RETRY', width / 2 - 20, height / 2 - 14)
      }
    }

    const tick = () => {
      if (flappyActionRef.current) {
        flap()
        flappyActionRef.current = false
      }

      if (phase === 'running') {
        frame += 1
        velY += gravity
        birdY += velY

        if (frame % Math.round(isTouchOptimized ? 102 : 88) === 0) {
          const gapTop = 12 + Math.random() * (height - gapSize - 30)
          pipes.push({ x: width + pipeWidth, gapTop, passed: false })
        }

        pipes = pipes
          .map((pipe) => ({ ...pipe, x: pipe.x - (isTouchOptimized ? 0.64 : 0.5) }))
          .filter((pipe) => pipe.x > -pipeWidth - 2)

        pipes.forEach((pipe) => {
          if (!pipe.passed && pipe.x + pipeWidth < birdX) {
            pipe.passed = true
            score += 1
            setFlappyScore(score)
          }
          const withinX = birdX + 2 > pipe.x && birdX - 2 < pipe.x + pipeWidth
          const hitsPipe = withinX && (birdY - 2 < pipe.gapTop || birdY + 2 > pipe.gapTop + gapSize)
          if (hitsPipe) {
            fail()
          }
        })

        if (birdY < 2 || birdY > height - 12) {
          fail()
        }
      }

      draw()
      rafId = window.requestAnimationFrame(tick)
    }

    rafId = window.requestAnimationFrame(tick)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.cancelAnimationFrame(rafId)
      flappyActionRef.current = false
    }
  }, [isTouchOptimized, flappyCanvasVersion])

  useEffect(() => {
    activeStationIdRef.current = activeStationId
  }, [activeStationId])

  const syncTunerPosition = (clientX: number) => {
    const track = tunerTrackRef.current
    if (!track) {
      return
    }
    const bounds = track.getBoundingClientRect()
    const nextPosition = clamp01((clientX - bounds.left) / bounds.width)
    setTunerPosition(nextPosition)
    setActiveStationId(nearestStationForPosition(nextPosition)?.id ?? null)
  }

  useEffect(() => {
    if (!isTunerDragging) {
      return
    }
    const handlePointerMove = (event: PointerEvent) => {
      syncTunerPosition(event.clientX)
    }
    const handlePointerUp = () => {
      setIsTunerDragging(false)
      const tunedStation = nearestStationForPosition(tunerPosition)
      if (tunedStation) {
        setTunerPosition(tunedStation.position)
        setActiveStationId(tunedStation.id)
      }
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isTunerDragging, tunerPosition])

  const clearRadioTimers = () => {
    if (noteTimerRef.current !== null) {
      window.clearTimeout(noteTimerRef.current)
      noteTimerRef.current = null
    }
    if (tuneTimerRef.current !== null) {
      window.clearTimeout(tuneTimerRef.current)
      tuneTimerRef.current = null
    }
  }

  useEffect(() => {
    let mounted = true
    const parseTracks = (
      tracks: Array<{ title?: string; file?: string }>,
      stationId: RadioStation['id'],
    ): UploadedTune[] =>
      tracks
        .map((track) => ({
          title: String(track.title ?? '').trim(),
          file: String(track.file ?? '').trim(),
        }))
        .filter((track) => track.title.length > 0 && track.file.length > 0)
        .map((track) => ({
          ...track,
          file: track.file.includes('/') ? track.file : `${stationId}/${track.file}`,
        }))

    const loadUploadedTunes = async () => {
      try {
        const response = await fetch('/hype-fm/library2.json', { cache: 'no-store' })
        if (!response.ok) {
          return
        }
        const json = (await response.json()) as {
          tracks?: Array<{ title?: string; file?: string }>
          stations?: Partial<Record<RadioStation['id'], Array<{ title?: string; file?: string }>>>
        }
        if (!mounted) {
          return
        }
        const hypeTracks = parseTracks(json.stations?.hype ?? [], 'hype')
        const nightTracks = parseTracks(json.stations?.night ?? [], 'night')

        // Backward compatibility: legacy "tracks" list maps to HYPE station.
        const fallbackTracks = parseTracks(json.tracks ?? [], 'hype')
        const nextByStation: UploadedTunesByStation = {
          hype: hypeTracks.length > 0 ? hypeTracks : fallbackTracks,
          night: nightTracks,
        }

        const signature = JSON.stringify(nextByStation)
        if (signature !== uploadedLibrarySigRef.current) {
          uploadedLibrarySigRef.current = signature
          setUploadedTunesByStation(nextByStation)
        }
      } catch {
        // Keep radio on synth fallback when upload manifest is missing or invalid.
      }
    }

    void loadUploadedTunes()
    const pollId = window.setInterval(() => {
      void loadUploadedTunes()
    }, 5000)
    const handleFocus = () => {
      void loadUploadedTunes()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      mounted = false
      window.clearInterval(pollId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const ensureAudioContext = async () => {
    if (!audioCtxRef.current) {
      const AudioCtxCtor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtxCtor) {
        return null
      }
      audioCtxRef.current = new AudioCtxCtor()
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  const playSynthNote = (ctx: AudioContext, midi: number, stepSeconds: number) => {
    const nowAt = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = midiToFrequency(midi)
    gain.gain.setValueAtTime(0.0001, nowAt)
    gain.gain.linearRampToValueAtTime(0.08, nowAt + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, nowAt + stepSeconds * 0.8)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(nowAt)
    osc.stop(nowAt + stepSeconds * 0.82)
  }

  const stopCrackle = () => {
    if (crackleTimerRef.current !== null) {
      window.clearInterval(crackleTimerRef.current)
      crackleTimerRef.current = null
    }
    if (crackleSourceRef.current) {
      try {
        crackleSourceRef.current.stop()
      } catch {
        // Ignore stop errors when source has already ended.
      }
      crackleSourceRef.current.disconnect()
      crackleSourceRef.current = null
    }
    if (crackleGainRef.current) {
      crackleGainRef.current.disconnect()
      crackleGainRef.current = null
    }
  }

  const startCrackle = async () => {
    if (!radioOnRef.current || crackleSourceRef.current) {
      return
    }
    const ctx = await ensureAudioContext()
    if (!ctx || !radioOnRef.current || activeStationIdRef.current) {
      return
    }
    const noiseLength = Math.max(1, Math.floor(ctx.sampleRate * 1.5))
    const buffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < noiseLength; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.85
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const highPass = ctx.createBiquadFilter()
    highPass.type = 'highpass'
    highPass.frequency.value = 1200
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.01, ctx.currentTime)

    source.connect(highPass)
    highPass.connect(gain)
    gain.connect(ctx.destination)
    source.start()

    crackleSourceRef.current = source
    crackleGainRef.current = gain
    crackleTimerRef.current = window.setInterval(() => {
      const node = crackleGainRef.current
      const localCtx = audioCtxRef.current
      if (!node || !localCtx || !radioOnRef.current || activeStationIdRef.current) {
        return
      }
      const target = 0.01 + Math.random() * 0.06
      node.gain.cancelScheduledValues(localCtx.currentTime)
      node.gain.setTargetAtTime(target, localCtx.currentTime, 0.02)
    }, 110)
  }

  const scheduleRadioStep = () => {
    if (!radioOnRef.current) {
      return
    }

    const station = stationById(activeStationIdRef.current) ?? RADIO_STATIONS[0]
    const songPool = station.songIndexes
    if (!songPool.includes(songIndexRef.current)) {
      songIndexRef.current = songPool[0]
      noteIndexRef.current = 0
      setCurrentSongIndex(songPool[0])
    }
    const song = RADIO_LIBRARY[songIndexRef.current]
    const stepSeconds = 60 / song.bpm / 2
    const note = song.notes[noteIndexRef.current]

    if (note !== null) {
      void ensureAudioContext().then((ctx) => {
        if (ctx && radioOnRef.current) {
          playSynthNote(ctx, note, stepSeconds)
        }
      })
    }

    let nextNoteIndex = noteIndexRef.current + 1
    if (nextNoteIndex >= song.notes.length) {
      const currentPoolIndex = songPool.indexOf(songIndexRef.current)
      const nextPoolIndex = currentPoolIndex >= 0 ? (currentPoolIndex + 1) % songPool.length : 0
      songIndexRef.current = songPool[nextPoolIndex]
      setCurrentSongIndex(songIndexRef.current)
      nextNoteIndex = 0
    }
    noteIndexRef.current = nextNoteIndex

    noteTimerRef.current = window.setTimeout(scheduleRadioStep, stepSeconds * 1000)
  }

  const stopUploadedRadio = () => {
    const audio = audioElRef.current
    if (!audio) {
      return
    }
    audio.pause()
    audio.onended = null
    audio.src = ''
  }

  const playUploadedTrack = async (
    stationId: RadioStation['id'],
    trackIndex: number,
    randomSeek: boolean,
    startAtSec?: number,
  ) => {
    const stationTunes = uploadedTunesByStation[stationId] ?? []
    if (!radioOnRef.current || stationTunes.length === 0) {
      return
    }

    const track = stationTunes[trackIndex]
    let audio = audioElRef.current
    if (!audio) {
      audio = new Audio()
      audio.preload = 'metadata'
      audioElRef.current = audio
    }

    audio.pause()
    audio.preload = 'metadata'
    audio.onended = null
    audio.onloadedmetadata = null
    audio.onerror = null
    audio.src = `/hype-fm/${encodePublicPath(track.file)}`
    setCurrentTrackLabel(track.title)

    audio.onloadedmetadata = async () => {
      if (Number.isFinite(startAtSec) && Number.isFinite(audio.duration) && audio.duration > 1) {
        audio.currentTime = Math.min(Math.max(startAtSec ?? 0, 0), Math.max(audio.duration - 0.5, 0))
      } else if (randomSeek && Number.isFinite(audio.duration) && audio.duration > 1) {
        audio.currentTime = Math.random() * Math.max(audio.duration - 1, 0)
      }
      try {
        await audio.play()
      } catch {
        // Ignore autoplay/playback interruption errors from quick toggles.
      }
    }

    audio.onended = () => {
      if (!radioOnRef.current || activeStationIdRef.current !== stationId) {
        return
      }
      const nextTrackIndex = (uploadedIndexRef.current + 1) % stationTunes.length
      uploadedIndexRef.current = nextTrackIndex
      setRadioSessionByStation((prev) => ({
        ...prev,
        [stationId]: { mode: 'uploads', uploadedTrackIndex: nextTrackIndex, uploadedTimeSec: 0 },
      }))
      void playUploadedTrack(stationId, nextTrackIndex, false)
    }
  }

  const persistStationPlaybackState = (stationId: RadioStation['id']) => {
    const stationTunes = uploadedTunesByStation[stationId] ?? []
    if (stationTunes.length > 0) {
      const audio = audioElRef.current
      const currentTime = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0
      setRadioSessionByStation((prev) => ({
        ...prev,
        [stationId]: {
          mode: 'uploads',
          uploadedTrackIndex: uploadedIndexRef.current,
          uploadedTimeSec: Math.max(0, currentTime),
        },
      }))
      return
    }
    setRadioSessionByStation((prev) => ({
      ...prev,
      [stationId]: {
        mode: 'synth',
        songIndex: songIndexRef.current,
        noteIndex: noteIndexRef.current,
      },
    }))
  }

  const stopRadio = () => {
    if (radioOnRef.current && currentPlaybackStationIdRef.current) {
      persistStationPlaybackState(currentPlaybackStationIdRef.current)
    }
    radioOnRef.current = false
    clearRadioTimers()
    stopUploadedRadio()
    stopCrackle()
    setIsRadioOn(false)
    setIsTuning(false)
    setCurrentSongIndex(null)
    setCurrentTrackLabel('')
  }

  const startStationPlayback = (station: RadioStation) => {
    const stationTunes = uploadedTunesByStation[station.id] ?? []
    const persistedState = radioSessionByStation[station.id]
    const useUploads = stationTunes.length > 0
    let restoredUploadTimeSec: number | undefined
    clearRadioTimers()
    stopUploadedRadio()
    stopCrackle()
    if (useUploads) {
      let startTrackIndex = Math.floor(Math.random() * stationTunes.length)
      if (
        persistedState?.mode === 'uploads' &&
        stationTunes[persistedState.uploadedTrackIndex]
      ) {
        startTrackIndex = persistedState.uploadedTrackIndex
        restoredUploadTimeSec = persistedState.uploadedTimeSec
      }
      uploadedIndexRef.current = startTrackIndex
      setCurrentTrackLabel(stationTunes[startTrackIndex].title)
      setCurrentSongIndex(null)
    } else {
      const songPool = station.songIndexes
      const hasPersistedSynthState =
        persistedState?.mode === 'synth' &&
        songPool.includes(persistedState.songIndex) &&
        Number.isFinite(persistedState.noteIndex)
      const startSongIndex = hasPersistedSynthState
        ? persistedState.songIndex
        : songPool[Math.floor(Math.random() * songPool.length)]
      const startSong = RADIO_LIBRARY[startSongIndex]
      const normalizedPersistedNoteIndex =
        hasPersistedSynthState && startSong.notes.length > 0
          ? persistedState.noteIndex % startSong.notes.length
          : 0
      const startNoteIndex = hasPersistedSynthState
        ? normalizedPersistedNoteIndex
        : Math.floor(Math.random() * startSong.notes.length)
      songIndexRef.current = startSongIndex
      noteIndexRef.current = startNoteIndex
      setCurrentSongIndex(startSongIndex)
      setCurrentTrackLabel(RADIO_LIBRARY[startSongIndex].title)
    }

    currentPlaybackStationIdRef.current = station.id
    radioOnRef.current = true
    setIsRadioOn(true)
    setIsTuning(true)

    tuneTimerRef.current = window.setTimeout(() => {
      if (!radioOnRef.current) {
        return
      }
      setIsTuning(false)
      if (useUploads) {
        void playUploadedTrack(station.id, uploadedIndexRef.current, restoredUploadTimeSec === undefined, restoredUploadTimeSec)
      } else {
        void ensureAudioContext().then(() => {
          scheduleRadioStep()
        })
      }
    }, 800 + Math.floor(Math.random() * 900))
  }

  const toggleRadio = async () => {
    if (radioOnRef.current) {
      stopRadio()
      return
    }
    if (!activeStation) {
      currentPlaybackStationIdRef.current = null
      radioOnRef.current = true
      setIsRadioOn(true)
      setIsTuning(false)
      setCurrentSongIndex(null)
      setCurrentTrackLabel('Static...')
      void startCrackle()
      return
    }
    startStationPlayback(activeStation)
  }

  const skipRadioTrack = () => {
    if (!radioOnRef.current || isTuning || !activeStation) {
      return
    }

    const stationTunes = uploadedTunesByStation[activeStation.id] ?? []
    if (stationTunes.length > 0) {
      const nextTrackIndex = (uploadedIndexRef.current + 1) % stationTunes.length
      uploadedIndexRef.current = nextTrackIndex
      setRadioSessionByStation((prev) => ({
        ...prev,
        [activeStation.id]: { mode: 'uploads', uploadedTrackIndex: nextTrackIndex, uploadedTimeSec: 0 },
      }))
      void playUploadedTrack(activeStation.id, nextTrackIndex, false)
      return
    }

    clearRadioTimers()
    const songPool = activeStation.songIndexes
    const currentPoolIndex = songPool.indexOf(songIndexRef.current)
    const nextPoolIndex = currentPoolIndex >= 0 ? (currentPoolIndex + 1) % songPool.length : 0
    const nextSongIndex = songPool[nextPoolIndex]
    songIndexRef.current = nextSongIndex
    noteIndexRef.current = 0
    setRadioSessionByStation((prev) => ({
      ...prev,
      [activeStation.id]: { mode: 'synth', songIndex: nextSongIndex, noteIndex: 0 },
    }))
    setCurrentSongIndex(nextSongIndex)
    setCurrentTrackLabel(RADIO_LIBRARY[nextSongIndex].title)
    scheduleRadioStep()
  }

  useEffect(() => {
    if (!radioOnRef.current) {
      return
    }
    if (currentPlaybackStationIdRef.current && currentPlaybackStationIdRef.current !== activeStationId) {
      persistStationPlaybackState(currentPlaybackStationIdRef.current)
    }
    if (!activeStation) {
      clearRadioTimers()
      stopUploadedRadio()
      setIsTuning(false)
      setCurrentSongIndex(null)
      setCurrentTrackLabel('Static...')
      currentPlaybackStationIdRef.current = null
      void startCrackle()
      return
    }
    startStationPlayback(activeStation)
  }, [activeStationId])

  useEffect(() => {
    return () => {
      radioOnRef.current = false
      clearRadioTimers()
      stopUploadedRadio()
      stopCrackle()
      Object.values(slotCooldownTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId)
      })
      slotCooldownTimersRef.current = {}
      if (memoryHideTimerRef.current !== null) {
        window.clearTimeout(memoryHideTimerRef.current)
        memoryHideTimerRef.current = null
      }
    }
  }, [])

  const startSlotCooldown = (slotIndex: number) => {
    const until = Date.now() + VOTED_SLOT_COOLDOWN_MS
    setSlotCooldownUntil((prev) => ({ ...prev, [slotIndex]: until }))
    const existingTimer = slotCooldownTimersRef.current[slotIndex]
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer)
    }
    slotCooldownTimersRef.current[slotIndex] = window.setTimeout(() => {
      setSlotCooldownUntil((prev) => {
        if ((prev[slotIndex] ?? 0) > Date.now()) {
          return prev
        }
        const next = { ...prev }
        delete next[slotIndex]
        return next
      })
      delete slotCooldownTimersRef.current[slotIndex]
    }, VOTED_SLOT_COOLDOWN_MS + 1000)
  }

  const skipSlotCooldownForDev = (slotIndex: number) => {
    if (!import.meta.env.DEV) {
      return
    }
    const existingTimer = slotCooldownTimersRef.current[slotIndex]
    if (existingTimer !== undefined) {
      window.clearTimeout(existingTimer)
      delete slotCooldownTimersRef.current[slotIndex]
    }
    setSlotCooldownUntil((prev) => {
      const next = { ...prev }
      delete next[slotIndex]
      return next
    })
  }

  const nowMs = now.getTime()
  const visibleSlots: CardSlot[] = []
  const selectionSeed = Math.floor(nowMs / (2 * 60 * 1000))
  const hashForSelection = (input: string) => {
    let hash = 0
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0
    }
    return hash
  }
  const sortedArcadeCards = [...miniArcadeCards].sort((a, b) => a.id.localeCompare(b.id))
  const selectedArcadeCards =
    sortedArcadeCards.length === 0
      ? []
      : sortedArcadeCards.length === 1
        ? [sortedArcadeCards[selectionSeed % sortedArcadeCards.length]]
        : [
            sortedArcadeCards[selectionSeed % sortedArcadeCards.length],
            sortedArcadeCards[(selectionSeed + 1) % sortedArcadeCards.length],
          ]
  const selectedPromptCard = [...MINI_PROMPT_CARDS].sort((a, b) => a.id.localeCompare(b.id))[selectionSeed % MINI_PROMPT_CARDS.length]
  const selectionPool = [...cards, ...selectedArcadeCards, selectedPromptCard]
  const availableTypeCards: Record<string, Card> = {}
  selectionPool.forEach((card) => {
    if (!availableTypeCards[card.tag]) {
      availableTypeCards[card.tag] = card
    }
  })
  const uniqueTypeQueue = Object.values(availableTypeCards).sort(
    (a, b) => hashForSelection(`${a.id}:${selectionSeed}`) - hashForSelection(`${b.id}:${selectionSeed}`),
  )
  for (let slotIndex = 0; slotIndex < CARD_SLOT_COUNT; slotIndex += 1) {
    const cooldownUntil = slotCooldownUntil[slotIndex] ?? 0
    if (cooldownUntil > nowMs) {
      visibleSlots.push({ card: null, cooldownUntil })
      continue
    }
    const previousCardId = lastCardIdBySlot[slotIndex]
    const preferredCardIndex = uniqueTypeQueue.findIndex((candidate) => candidate.id !== previousCardId)
    const selectedCardIndex = preferredCardIndex >= 0 ? preferredCardIndex : 0
    const nextCard = uniqueTypeQueue.splice(selectedCardIndex, 1)[0] ?? null
    visibleSlots.push({ card: nextCard, cooldownUntil: null })
  }
  const handleVote = (cardId: string, direction: -1 | 1) => {
    if (removingCardId) {
      return
    }
    const slotIndex = visibleSlots.findIndex((slot) => slot.card?.id === cardId)

    setVotes((prev) => {
      const current = prev[cardId] ?? 0
      const next = current === direction ? 0 : direction
      return { ...prev, [cardId]: next }
    })

    setRemovalDirection(direction)
    setRemovingCardId(cardId)

    window.setTimeout(() => {
      setCards((prev) => prev.filter((card) => card.id !== cardId))
      setVotes((prev) => {
        const next = { ...prev }
        delete next[cardId]
        return next
      })
      if (slotIndex >= 0) {
        setLastCardIdBySlot((prev) => ({ ...prev, [slotIndex]: cardId }))
        startSlotCooldown(slotIndex)
      }
      setRemovingCardId(null)
      setRemovalDirection(null)
    }, 520)
  }

  const patchCard = (cardId: string, patch: Partial<Card>) => {
    setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, ...patch } : card)))
  }

  const removeCard = (cardId: string) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId))
    setVotes((prev) => {
      const next = { ...prev }
      delete next[cardId]
      return next
    })
    if (removingCardId === cardId) {
      setRemovingCardId(null)
      setRemovalDirection(null)
    }
  }

  const patchMiniArcadeCard = (cardId: string, patch: Partial<Card>) => {
    setMiniArcadeCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, ...patch } : card)))
  }

  const patchMiniPrompt = (promptIndex: number, value: string) => {
    setMiniPrompts((prev) => prev.map((prompt, index) => (index === promptIndex ? value : prompt)))
  }

  const addCard = () => {
    const tag = newTag.trim()
    const title = newTitle.trim()
    const body = newBody.trim()
    if (!tag || !title || !body) {
      return
    }
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `card-${Date.now()}-${Math.random().toString(16).slice(2)}`
    setCards((prev) => [...prev, { id, tag, title, body, paws: PAW_SETS.greenRed }])
    setNewTag('BODY\nRESET')
    setNewTitle('REACTION TEST')
    setNewBody('TAP YOUR DESK 5 TIMES AS EVENLY AS POSSIBLE.')
  }

  const resetMemoryGame = () => {
    if (memoryHideTimerRef.current !== null) {
      window.clearTimeout(memoryHideTimerRef.current)
      memoryHideTimerRef.current = null
    }
    setMemoryTiles(createMemoryTiles())
    setMemoryOpenIds([])
    setMemoryMoves(0)
    setMemoryBusy(false)
  }

  const handleMemoryFlip = (tileId: number) => {
    if (memoryBusy || memoryOpenIds.length >= 2) {
      return
    }
    const tile = memoryTiles.find((entry) => entry.id === tileId)
    if (!tile || tile.matched || memoryOpenIds.includes(tileId)) {
      return
    }
    const nextOpen = [...memoryOpenIds, tileId]
    setMemoryOpenIds(nextOpen)

    if (nextOpen.length < 2) {
      return
    }

    setMemoryMoves((prev) => prev + 1)
    const [firstId, secondId] = nextOpen
    const firstTile = memoryTiles.find((entry) => entry.id === firstId)
    const secondTile = memoryTiles.find((entry) => entry.id === secondId)
    if (!firstTile || !secondTile) {
      setMemoryOpenIds([])
      return
    }

    if (firstTile.value === secondTile.value) {
      const nextTiles = memoryTiles.map((entry) =>
        entry.id === firstId || entry.id === secondId ? { ...entry, matched: true } : entry,
      )
      setMemoryTiles(nextTiles)
      setMemoryOpenIds([])
      if (nextTiles.every((entry) => entry.matched)) {
        setMemoryWins((prev) => prev + 1)
      }
      return
    }

    setMemoryBusy(true)
    memoryHideTimerRef.current = window.setTimeout(() => {
      setMemoryOpenIds([])
      setMemoryBusy(false)
      memoryHideTimerRef.current = null
    }, 520)
  }

  const sendMiniPromptEmail = async (payload: { cardId: MiniCardId; prompt: string; answer: string }) => {
    const response = await fetch('/api/tiny-prompt-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error(`Tiny prompt email failed with status ${response.status}`)
    }
  }

  const handleMiniPromptSubmit = (cardId: MiniCardId) => {
    const answer = miniPromptDrafts[cardId].trim()
    if (!answer) {
      return
    }
    const prompt =
      miniPrompts.length > 0 ? miniPrompts[miniPromptIndexes[cardId] % miniPrompts.length] : 'Tiny prompt (custom)'

    setMiniPromptDrafts((prev) => ({ ...prev, [cardId]: '' }))
    setMiniPromptFeedback((prev) => ({ ...prev, [cardId]: 'Saved!' }))
    setMiniPromptIndexes((prev) => ({
      ...prev,
      [cardId]: miniPrompts.length > 0 ? (prev[cardId] + 1) % miniPrompts.length : prev[cardId],
    }))

    void sendMiniPromptEmail({ cardId, prompt, answer })
      .then(() => {
        setMiniPromptFeedback((prev) => ({ ...prev, [cardId]: 'Saved + emailed!' }))
      })
      .catch(() => {
        setMiniPromptFeedback((prev) => ({ ...prev, [cardId]: 'Saved (email failed)' }))
      })
  }

  const startPongMove = useCallback((direction: -1 | 1) => {
    pongMoveDirectionRef.current = direction
  }, [])

  const stopPongMove = useCallback(() => {
    pongMoveDirectionRef.current = 0
  }, [])

  return (
    <main className={`app ${isCute ? 'app--cute' : 'app--stealth'}`}>
      {isCute ? (
        <div className="cute-shell">
          <section className={`cute-device ${isCuteCollapsed ? 'cute-device--collapsed' : ''}`.trim()}>
            <header className="cute-status-bar">
              <span className="cute-signal">HYPE CAT</span>
              <span className="cute-time">{timeLabel}</span>
              <span className="cute-date">{dateLabel}</span>
              <button
                type="button"
                className="cute-icon cute-icon--orange cute-collapse"
                aria-label={isCuteCollapsed ? 'Expand window' : 'Collapse window'}
                aria-expanded={!isCuteCollapsed}
                onClick={() => setIsCuteCollapsed((collapsed) => !collapsed)}
              >
                ▬
              </button>
              <span className="cute-icon cute-icon--mono" aria-hidden="true">
                M
              </span>
              <div className="cute-battery-wrap" ref={batteryPanelRef}>
                <button
                  type="button"
                  className="cute-battery cute-battery-button"
                  aria-label="Show personal battery levels"
                  aria-expanded={isBatteryPanelOpen}
                  onClick={() => setIsBatteryPanelOpen((open) => !open)}
                >
                  <img src="/ui-battery.png" alt="" />
                </button>
                {isBatteryPanelOpen ? (
                  <div className="cute-battery-popup" role="status" aria-live="polite">
                    <p>Battery Approx</p>
                    <span className="cute-battery-popup__row">
                      <strong>Social</strong>
                      <span className="cute-battery-popup__line" aria-hidden="true">
                        <span style={{ width: meterWidth(socialBattery) }} />
                      </span>
                      <span className="cute-battery-popup__value">{socialBattery}%</span>
                    </span>
                    <span className="cute-battery-popup__row">
                      <strong>Sleep</strong>
                      <span className="cute-battery-popup__line" aria-hidden="true">
                        <span style={{ width: meterWidth(sleepBattery) }} />
                      </span>
                      <span className="cute-battery-popup__value">{sleepBattery}%</span>
                    </span>
                    <span className="cute-battery-popup__row">
                      <strong>Attention</strong>
                      <span className="cute-battery-popup__line" aria-hidden="true">
                        <span style={{ width: meterWidth(attentionBattery) }} />
                      </span>
                      <span className="cute-battery-popup__value">{attentionBattery}%</span>
                    </span>
                  </div>
                ) : null}
              </div>
            </header>

            {!isCuteCollapsed ? (
              <>
                <section className="cute-card-grid" aria-label="Break cards">
                    {visibleSlots.every((slot) => slot.card === null) ? (
                      <article className="cute-empty" aria-live="polite">
                        <p>All cards paw-sorted.</p>
                      </article>
                    ) : (
                      visibleSlots.map((slot, index) => {
                        const card = slot.card
                        const miniCardId: MiniCardId | null =
                          card?.id === 'arcade-pong' ? 'pong' : card?.id === 'arcade-flappy' ? 'flappy' : card?.id === 'arcade-memory' ? 'memory' : null
                        const promptCardId: MiniCardId | null =
                          card?.id === 'prompt-pong' ? 'pong' : card?.id === 'prompt-flappy' ? 'flappy' : card?.id === 'prompt-memory' ? 'memory' : null
                        if (!card) {
                          const minutesLeft =
                            slot.cooldownUntil === null ? 0 : Math.max(1, Math.ceil((slot.cooldownUntil - nowMs) / 60000))
                          return (
                            <article key={`empty-slot-${index}`} className="cute-card cute-card--empty-slot" aria-label={`Card slot ${index + 1} empty`}>
                              {slot.cooldownUntil ? (
                                <>
                                  {import.meta.env.DEV ? (
                                    <button
                                      type="button"
                                      className="cute-refill-visual cute-refill-visual--button"
                                      onClick={() => skipSlotCooldownForDev(index)}
                                      aria-label="Skip cooldown for this slot"
                                    >
                                      <span className="steam steam--one" />
                                      <span className="steam steam--two" />
                                      <span className="steam steam--three" />
                                      <span className="cup" />
                                    </button>
                                  ) : (
                                    <span className="cute-refill-visual" aria-hidden="true">
                                      <span className="steam steam--one" />
                                      <span className="steam steam--two" />
                                      <span className="steam steam--three" />
                                      <span className="cup" />
                                    </span>
                                  )}
                                  <p>{`Refills in ${minutesLeft}m`}</p>
                                </>
                              ) : (
                                <p>No cards queued</p>
                              )}
                            </article>
                          )
                        }
                        return (
                          <Fragment key={card.id}>
                            <article
                              className={`cute-card ${miniCardId ? 'cute-card--mini-game' : ''} ${promptCardId ? 'cute-card--mini-prompt-card' : ''} ${(votes[card.id] ?? 0) !== 0 ? 'cute-card--focus' : ''} ${removingCardId === card.id ? 'cute-card--removing' : ''}`.trim()}
                              aria-label={`Card ${index + 1}`}
                            >
                            <div className={`cute-card-reveal ${removingCardId === card.id ? 'cute-card-reveal--visible' : ''}`.trim()}>
                              {removalDirection === 1 ? 'PAW UP LOGGED' : 'PAW DOWN LOGGED'}
                            </div>
                            <div className={`cute-card-surface ${miniCardId ? 'cute-card-surface--mini' : ''}`.trim()}>
                              <div className="cute-card-top" aria-hidden="true">
                                {card.tag.split('\n').map((line) => (
                                  <span key={line}>{line}</span>
                                ))}
                              </div>
                              {miniCardId ? (
                                <div className="cute-mini-card-body">
                                  {miniCardId === 'pong' ? (
                                    <>
                                      <canvas
                                        ref={setPongCanvasNode}
                                        className="cute-mini-games__canvas"
                                        aria-label="Pong mini game"
                                      />
                                      <p className="cute-mini-games__meta">P {pongScore.player} : {pongScore.cpu} CPU</p>
                                      <div className="cute-mini-games__controls">
                                        <button
                                          type="button"
                                          onPointerDown={() => startPongMove(-1)}
                                          onPointerUp={stopPongMove}
                                          onPointerLeave={stopPongMove}
                                          onBlur={stopPongMove}
                                        >
                                          Up
                                        </button>
                                        <button
                                          type="button"
                                          onPointerDown={() => startPongMove(1)}
                                          onPointerUp={stopPongMove}
                                          onPointerLeave={stopPongMove}
                                          onBlur={stopPongMove}
                                        >
                                          Down
                                        </button>
                                      </div>
                                    </>
                                  ) : null}

                                  {miniCardId === 'flappy' ? (
                                    <>
                                      <canvas
                                        ref={setFlappyCanvasNode}
                                        className="cute-mini-games__canvas"
                                        aria-label="Flappy mini game"
                                      />
                                      <p className="cute-mini-games__meta">
                                        Score {flappyScore} / Best {Math.max(flappyBest, flappyScore)} ({flappyPhase})
                                      </p>
                                      <div className="cute-mini-games__controls">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            flappyActionRef.current = true
                                          }}
                                        >
                                          {flappyPhase === 'over' ? 'Retry' : 'Tap'}
                                        </button>
                                      </div>
                                    </>
                                  ) : null}

                                  {miniCardId === 'memory' ? (
                                    <>
                                      <div className="cute-memory-grid" role="group" aria-label="Tiny memory game">
                                        {memoryTiles.map((tile) => {
                                          const isOpen = tile.matched || memoryOpenIds.includes(tile.id)
                                          return (
                                            <button
                                              key={tile.id}
                                              type="button"
                                              className={`cute-memory-tile ${isOpen ? 'is-open' : ''}`.trim()}
                                              onClick={() => handleMemoryFlip(tile.id)}
                                              disabled={memoryBusy || tile.matched}
                                              aria-label={isOpen ? `Tile ${tile.value}` : 'Hidden tile'}
                                            >
                                              {isOpen ? tile.value : '?'}
                                            </button>
                                          )
                                        })}
                                      </div>
                                      <p className="cute-mini-games__meta">
                                        Moves {memoryMoves} / Wins {memoryWins}
                                      </p>
                                      <div className="cute-mini-games__controls">
                                        <button type="button" onClick={resetMemoryGame}>
                                          Shuffle
                                        </button>
                                      </div>
                                    </>
                                  ) : null}

                                  <div className="cute-actions cute-actions--paws">
                                    <button
                                      type="button"
                                      aria-label={`Upvote ${card.title}`}
                                      title="Paw up"
                                      aria-pressed={(votes[card.id] ?? 0) === 1}
                                      disabled={Boolean(removingCardId)}
                                      onClick={() => handleVote(card.id, 1)}
                                    >
                                      <img src={card.paws[0]} alt="" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Downvote ${card.title}`}
                                      title="Paw down"
                                      aria-pressed={(votes[card.id] ?? 0) === -1}
                                      disabled={Boolean(removingCardId)}
                                      onClick={() => handleVote(card.id, -1)}
                                    >
                                      <img src={card.paws[1]} alt="" />
                                    </button>
                                  </div>
                                </div>
                              ) : promptCardId ? (
                                <>
                                  <div className="cute-card-content">
                                    <h3>TINY PROMPT</h3>
                                    <form
                                      className="cute-mini-prompt"
                                      onSubmit={(event) => {
                                        event.preventDefault()
                                        handleMiniPromptSubmit(promptCardId)
                                      }}
                                    >
                                      <p className="cute-mini-prompt__question">
                                        {miniPrompts.length > 0
                                          ? miniPrompts[miniPromptIndexes[promptCardId] % miniPrompts.length]
                                          : 'Add tiny prompts in Card manager.'}
                                      </p>
                                      <div className="cute-mini-prompt__row">
                                        <input
                                          value={miniPromptDrafts[promptCardId]}
                                          onChange={(event) =>
                                            setMiniPromptDrafts((prev) => ({ ...prev, [promptCardId]: event.target.value }))
                                          }
                                          maxLength={40}
                                          placeholder="tiny answer"
                                        />
                                        <button type="submit">Send</button>
                                      </div>
                                      {miniPromptFeedback[promptCardId] ? (
                                        <p className="cute-mini-prompt__feedback">{miniPromptFeedback[promptCardId]}</p>
                                      ) : null}
                                    </form>
                                  </div>
                                  <div className="cute-actions cute-actions--paws">
                                    <button
                                      type="button"
                                      aria-label={`Upvote ${card.title}`}
                                      title="Paw up"
                                      aria-pressed={(votes[card.id] ?? 0) === 1}
                                      disabled={Boolean(removingCardId)}
                                      onClick={() => handleVote(card.id, 1)}
                                    >
                                      <img src={card.paws[0]} alt="" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Downvote ${card.title}`}
                                      title="Paw down"
                                      aria-pressed={(votes[card.id] ?? 0) === -1}
                                      disabled={Boolean(removingCardId)}
                                      onClick={() => handleVote(card.id, -1)}
                                    >
                                      <img src={card.paws[1]} alt="" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="cute-card-content">
                                    <h3>{card.title}</h3>
                                    <p>{card.body}</p>
                                  </div>
                                  <div className="cute-actions cute-actions--paws">
                                    <button
                                      type="button"
                                      aria-label={`Upvote ${card.title}`}
                                      title="Paw up"
                                      aria-pressed={(votes[card.id] ?? 0) === 1}
                                      disabled={Boolean(removingCardId)}
                                      onClick={() => handleVote(card.id, 1)}
                                    >
                                      <img src={card.paws[0]} alt="" />
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Downvote ${card.title}`}
                                      title="Paw down"
                                      aria-pressed={(votes[card.id] ?? 0) === -1}
                                      disabled={Boolean(removingCardId)}
                                      onClick={() => handleVote(card.id, -1)}
                                    >
                                      <img src={card.paws[1]} alt="" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                            </article>
                          </Fragment>
                        )
                      })
                    )}
                </section>

                <div className="cute-bottom-whitespace" aria-hidden="true" />

                <footer className="cute-bottom-strip">
                  <div className="cute-radio" aria-live="polite">
                    <div
                      className="cute-radio__tuner"
                      ref={tunerTrackRef}
                      onPointerDown={(event) => {
                        event.preventDefault()
                        setIsTunerDragging(true)
                        syncTunerPosition(event.clientX)
                      }}
                    >
                      <svg className="cute-radio__wave" viewBox="0 0 900 44" preserveAspectRatio="none" aria-hidden="true">
                        <path d={radioWavePath} />
                      </svg>
                      {RADIO_STATIONS.map((station) => (
                        <span
                          key={station.id}
                          className={`cute-radio__station ${activeStationId === station.id ? 'cute-radio__station--active' : ''}`.trim()}
                          style={{ left: `${station.position * 100}%` }}
                          aria-hidden="true"
                        />
                      ))}
                      <button
                        type="button"
                        className="cute-radio__dial"
                        aria-label="Drag tuner"
                        style={{ left: `${tunerPosition * 100}%` }}
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setIsTunerDragging(true)
                          syncTunerPosition(event.clientX)
                        }}
                      >
                        <span />
                      </button>
                    </div>

                    <span />

                    <div className="cute-radio__lower">
                      <div>
                        <p className="cute-radio__brand">{activeStation?.name ?? 'NO SIGNAL'}</p>
                        <p className="cute-radio__track">
                          {activeStation
                            ? isRadioOn
                              ? isTuning
                                ? 'Tuning...'
                                : `Now: ${currentTrackLabel || RADIO_LIBRARY[currentSongIndex ?? activeStation.songIndexes[0]].title}`
                              : activeStationUploadedTunes.length > 0
                                ? `${activeStationUploadedTunes.length} tune(s) ready`
                                : `${activeStation.songIndexes.length} tune(s) ready`
                            : 'Move slider to station'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="cute-radio__play"
                        aria-label={isRadioOn ? 'Turn radio off' : 'Turn radio on'}
                        onClick={() => void toggleRadio()}
                      >
                        <span className={`cute-radio__play-icon ${isRadioOn ? 'cute-radio__play-icon--pause' : 'cute-radio__play-icon--play'}`}>
                          {isRadioOn ? '||' : '▶'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <span className="cute-weather">
                    <img src={weather.iconSrc} alt={weather.label} title={weather.label} />
                    <span className="cute-weather-inline">{`${weatherTemperatureLabel} • ${weather.label}`}</span>
                    <span className="cute-weather-popup">{`${weatherTemperatureLabel} • ${weather.label}`}</span>
                  </span>
                  <div className="cute-mini-calendar">
                    <p>{monthYearLabel}</p>
                    <div className="week-row">
                      {weekdayLabels.map((label, idx) => (
                        <span
                          key={label}
                          className={idx === new Date().getDay() ? 'today' : ''}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </footer>
              </>
            ) : null}
          </section>
        </div>
      ) : (
        <section className="stealth-shell" aria-label="Stealth interface">
          <section className="stealth-portal">
            <header className="stealth-header">
              <h1 className="stealth-brand">
                S<span>-</span>LIB
              </h1>
              <p className="stealth-subline">Internal break queue</p>
            </header>

            <section className="stealth-meta" aria-hidden="true">
              <article className="meta-box">
                <span>Active cards</span>
                <strong>{cards.length}</strong>
              </article>
              <article className="meta-box">
                <span>Mode</span>
                <strong>Stealth</strong>
              </article>
              <article className="meta-box">
                <span>Queue</span>
                <strong>Live</strong>
              </article>
              <article className="meta-box">
                <span>Cycle</span>
                <strong>07/20</strong>
              </article>
            </section>

            <section className="stealth-results" aria-label="Stealth cards">
              {visibleSlots.map((slot, index) => {
                const card = slot.card
                const miniCardId: MiniCardId | null =
                  card?.id === 'arcade-pong' ? 'pong' : card?.id === 'arcade-flappy' ? 'flappy' : card?.id === 'arcade-memory' ? 'memory' : null
                if (!card) {
                  const minutesLeft =
                    slot.cooldownUntil === null ? 0 : Math.max(1, Math.ceil((slot.cooldownUntil - nowMs) / 60000))
                  return (
                    <article key={`stealth-empty-slot-${index}`} className="stealth-row stealth-row--empty" aria-live="polite">
                      <span className="row-index">{index + 1}</span>
                      <div className="row-main">
                        <p className="row-title">{slot.cooldownUntil ? 'Slot cooling down' : 'No card queued'}</p>
                        <p className="row-body">
                          {slot.cooldownUntil
                            ? `Refills in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`
                            : 'Card will appear when available.'}
                        </p>
                      </div>
                      <div className="row-actions">
                        <button type="button" disabled>
                          Approve
                        </button>
                        <button type="button" disabled>
                          Deprioritize
                        </button>
                      </div>
                    </article>
                  )
                }
                return (
                  <article key={card.id} className="stealth-row">
                    <span className="row-index">{index + 1}</span>
                    <div className="row-main">
                      <p className="row-title">{card.title}</p>
                      <p className="row-body">{card.body}</p>
                      {miniCardId === 'pong' ? (
                        <>
                          <canvas
                            ref={setPongCanvasNode}
                            className="cute-mini-games__canvas"
                            aria-label="Pong mini game"
                          />
                          <p className="cute-mini-games__meta">P {pongScore.player} : {pongScore.cpu} CPU</p>
                          <div className="stealth-mini-controls">
                            <button
                              type="button"
                              onPointerDown={() => startPongMove(-1)}
                              onPointerUp={stopPongMove}
                              onPointerLeave={stopPongMove}
                              onBlur={stopPongMove}
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onPointerDown={() => startPongMove(1)}
                              onPointerUp={stopPongMove}
                              onPointerLeave={stopPongMove}
                              onBlur={stopPongMove}
                            >
                              Down
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        aria-label={`Approve ${card.title}`}
                        aria-pressed={(votes[card.id] ?? 0) === 1}
                        disabled={Boolean(removingCardId)}
                        onClick={() => handleVote(card.id, 1)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        aria-label={`Deprioritize ${card.title}`}
                        aria-pressed={(votes[card.id] ?? 0) === -1}
                        disabled={Boolean(removingCardId)}
                        onClick={() => handleVote(card.id, -1)}
                      >
                        Deprioritize
                      </button>
                    </div>
                  </article>
                )
              })}
            </section>

            <section className="stealth-radio" aria-live="polite">
              <p className="stealth-radio__brand">{activeStation?.name ?? 'NO SIGNAL'}</p>
              <p className="stealth-radio__track">
                {activeStation
                  ? isRadioOn
                    ? isTuning
                      ? 'Tuning...'
                      : `Now: ${currentTrackLabel || RADIO_LIBRARY[currentSongIndex ?? activeStation.songIndexes[0]].title}`
                    : activeStationUploadedTunes.length > 0
                      ? `${activeStationUploadedTunes.length} tune(s) ready`
                      : `${activeStation.songIndexes.length} tune(s) ready`
                  : 'Move slider to station'}
              </p>
              <div className="stealth-radio__actions">
                <button
                  type="button"
                  className="stealth-radio__button"
                  onClick={() => void toggleRadio()}
                >
                  {isRadioOn ? 'Off' : 'Tune'}
                </button>
                <button
                  type="button"
                  className="stealth-radio__button"
                  onClick={skipRadioTrack}
                  disabled={!isRadioOn || isTuning || !activeStation}
                >
                  Skip
                </button>
              </div>
            </section>
          </section>
        </section>
      )}

      <div
        className={`cute-mode-switch ${!isCute ? 'cute-mode-switch--stealth' : ''}`.trim()}
        role="switch"
        aria-checked={isCute}
        aria-label="Toggle between CUTE and STEALTH mode"
        tabIndex={0}
        onClick={() => setIsCute((c) => !c)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            setIsCute((c) => !c)
          }
        }}
      >
        <span className={`mode-label ${!isCute ? 'mode-label--active' : ''}`.trim()}>STEALTH</span>
        <span className={`mode-toggle ${isCute ? 'mode-toggle--right' : 'mode-toggle--left'}`} aria-hidden>
          <span className="mode-toggle__knob" />
        </span>
        <span className={`mode-label ${isCute ? 'mode-label--active' : ''}`.trim()}>CUTE</span>
      </div>

      <button type="button" className="open-sheet" onClick={() => setIsSheetOpen(true)}>
        Card manager
      </button>

      {isSheetOpen ? (
        <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Card manager">
          <section className="sheet-modal">
            <header className="sheet-header">
              <h2>Card manager</h2>
              <button type="button" onClick={() => setIsSheetOpen(false)}>
                Close
              </button>
            </header>

            <div className="sheet-table-wrap">
              <table className="sheet-table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Title</th>
                    <th>Body</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id}>
                      <td>
                        <input
                          value={card.tag}
                          onChange={(e) => patchCard(card.id, { tag: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={card.title}
                          onChange={(e) => patchCard(card.id, { title: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={card.body}
                          onChange={(e) => patchCard(card.id, { body: e.target.value })}
                        />
                      </td>
                      <td>
                        <button type="button" onClick={() => removeCard(card.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sheet-table-wrap">
              <table className="sheet-table">
                <thead>
                  <tr>
                    <th>Arcade game</th>
                    <th>Tag</th>
                    <th>Title</th>
                    <th>Body</th>
                  </tr>
                </thead>
                <tbody>
                  {miniArcadeCards.map((card) => (
                    <tr key={card.id}>
                      <td>{card.id.replace('arcade-', '')}</td>
                      <td>
                        <input
                          value={card.tag}
                          onChange={(e) => patchMiniArcadeCard(card.id, { tag: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={card.title}
                          onChange={(e) => patchMiniArcadeCard(card.id, { title: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={card.body}
                          onChange={(e) => patchMiniArcadeCard(card.id, { body: e.target.value })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sheet-table-wrap">
              <table className="sheet-table">
                <thead>
                  <tr>
                    <th>Tiny prompt</th>
                    <th>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {miniPrompts.map((prompt, index) => (
                    <tr key={`tiny-prompt-${index}`}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          value={prompt}
                          onChange={(e) => patchMiniPrompt(index, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="sheet-footer">
              <p>Add a new standard card to both CUTE and STEALTH lists.</p>
              <div className="sheet-add-row">
                <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Tag" />
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title" />
                <input value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Body" />
                <button type="button" onClick={addCard}>
                  Add card
                </button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
