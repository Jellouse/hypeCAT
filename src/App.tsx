import { useEffect, useRef, useState } from 'react'
import {
  CARD_SLOT_COUNT,
  CARDS,
  CARDS_STORAGE_KEY,
  PAW_SETS,
  RADIO_LIBRARY,
  RADIO_SESSION_STORAGE_KEY,
  RADIO_STATIONS,
  SLOT_COOLDOWN_STORAGE_KEY,
  VOTED_SLOT_COOLDOWN_MS,
} from './app/constants'
import { HalftoneCmyk, PerlinNoise } from '@paper-design/shaders-react'
import {
  clamp01,
  encodePublicPath,
  loadPersistedCards,
  loadPersistedCooldowns,
  loadPersistedRadioSessionState,
  midiToFrequency,
  nearestStationForPosition,
  normalizeCardCategories,
  radioWavePath,
  resolveWeatherVisual,
  shouldSkipCooldownPersistence,
  stationById,
} from './app/helpers'
import type {
  Card,
  CardSlot,
  PersistedRadioSessionByStation,
  RadioStation,
  UploadedTune,
  UploadedTunesByStation,
  WeatherSnapshot,
} from './app/types'
import './index.css'

function App() {
  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const
  const isPromptCard = (card: Card) => card.tag.replace(/\s+/g, '').toUpperCase().startsWith('PROMPT')
  const [isCute, setIsCute] = useState(true)
  const isCuteCollapsed = false
  const [cards, setCards] = useState<Card[]>(() => normalizeCardCategories(loadPersistedCards(CARDS_STORAGE_KEY, CARDS)))
  const [slotCardIdBySlot, setSlotCardIdBySlot] = useState<Record<number, string | null>>({})
  const [lastCardIdBySlot, setLastCardIdBySlot] = useState<Record<number, string>>({})
  const [votes, setVotes] = useState<Record<string, -1 | 0 | 1>>({})
  const [removingCardId, setRemovingCardId] = useState<string | null>(null)
  const [removalDirection, setRemovalDirection] = useState<-1 | 1 | null>(null)
  const [slotCooldownUntil, setSlotCooldownUntil] = useState<Record<number, number>>(() => loadPersistedCooldowns())
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [newCardCategory, setNewCardCategory] = useState<'standard' | 'prompt'>('standard')
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
  const [isBatteryOverlayOpen, setIsBatteryOverlayOpen] = useState(false)
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 760px)').matches : false,
  )
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }))
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
    const media = window.matchMedia('(max-width: 760px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileLayout(event.matches)
    }
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    setIsMobileLayout(media.matches)
    handleResize()
    media.addEventListener('change', handleChange)
    window.addEventListener('resize', handleResize)
    return () => {
      media.removeEventListener('change', handleChange)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    if (newCardCategory === 'prompt') {
      setNewTag((current) => (current.trim().length === 0 || !current.replace(/\s+/g, '').toUpperCase().startsWith('PROMPT') ? 'PROMPT' : current))
      setNewTitle((current) => (current === 'REACTION TEST' ? 'TINY REFLECTION' : current))
      setNewBody((current) =>
        current === 'TAP YOUR DESK 5 TIMES AS EVENLY AS POSSIBLE.'
          ? 'WHAT WOULD MAKE YOUR NEXT 10 MINUTES BETTER?'
          : current,
      )
      return
    }

    setNewTag((current) => (current.trim().length === 0 || current.replace(/\s+/g, '').toUpperCase() === 'PROMPT' ? 'BODY\nRESET' : current))
    setNewTitle((current) => (current === 'TINY REFLECTION' ? 'REACTION TEST' : current))
    setNewBody((current) =>
      current === 'WHAT WOULD MAKE YOUR NEXT 10 MINUTES BETTER?'
        ? 'TAP YOUR DESK 5 TIMES AS EVENLY AS POSSIBLE.'
        : current,
    )
  }, [newCardCategory])

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

  const nowMs = now.getTime()
  const cardsById = new Map(cards.map((card) => [card.id, card]))
  const promptCards = cards.filter((card) => isPromptCard(card))
  const standardCards = cards.filter((card) => !isPromptCard(card))

  useEffect(() => {
    const currentCardsById = new Map(cards.map((card) => [card.id, card]))
    setSlotCardIdBySlot((prev) => {
      const next: Record<number, string | null> = {}
      const usedIds = new Set<string>()
      const pickRandomCard = (pool: Card[]) => pool[Math.floor(Math.random() * pool.length)] ?? null

      for (let slotIndex = 0; slotIndex < CARD_SLOT_COUNT; slotIndex += 1) {
        const cooldownUntil = slotCooldownUntil[slotIndex] ?? 0
        if (cooldownUntil > nowMs) {
          next[slotIndex] = null
          continue
        }

        const currentCardId = prev[slotIndex] ?? null
        if (currentCardId && currentCardsById.has(currentCardId) && !usedIds.has(currentCardId)) {
          next[slotIndex] = currentCardId
          usedIds.add(currentCardId)
          continue
        }

        const previousCardId = lastCardIdBySlot[slotIndex]
        const availableCards = cards.filter((card) => !usedIds.has(card.id))
        const preferredPool = availableCards.filter((card) => card.id !== previousCardId)
        const preferred = pickRandomCard(preferredPool.length > 0 ? preferredPool : availableCards)
        next[slotIndex] = preferred?.id ?? null
        if (preferred) {
          usedIds.add(preferred.id)
        }
      }

      for (let slotIndex = 0; slotIndex < CARD_SLOT_COUNT; slotIndex += 1) {
        if ((prev[slotIndex] ?? null) !== (next[slotIndex] ?? null)) {
          return next
        }
      }
      return prev
    })
  }, [cards, lastCardIdBySlot, nowMs, slotCooldownUntil])

  const visibleSlots: CardSlot[] = []
  for (let slotIndex = 0; slotIndex < CARD_SLOT_COUNT; slotIndex += 1) {
    const cooldownUntil = slotCooldownUntil[slotIndex] ?? 0
    if (cooldownUntil > nowMs) {
      visibleSlots.push({ card: null, cooldownUntil })
      continue
    }
    const slotCardId = slotCardIdBySlot[slotIndex] ?? null
    const nextCard = slotCardId ? (cardsById.get(slotCardId) ?? null) : null
    visibleSlots.push({ card: nextCard, cooldownUntil: null })
  }
  const isAllCardsPawSorted = visibleSlots.every((slot) => slot.card === null)
  const desktopCuteWidth = 682
  const desktopCuteHeight = 748
  const cuteDeviceScale = Math.min(
    1,
    Math.max(0.1, (viewportSize.width - (isMobileLayout ? 56 : 120)) / desktopCuteWidth),
    Math.max(0.1, (viewportSize.height - (isMobileLayout ? 128 : 140)) / desktopCuteHeight),
  )
  const cuteFrameWidth = desktopCuteWidth * cuteDeviceScale
  const cuteFrameHeight = desktopCuteHeight * cuteDeviceScale

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
        setSlotCardIdBySlot((prev) => ({ ...prev, [slotIndex]: null }))
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
    setSlotCardIdBySlot((prev) => {
      const next: Record<number, string | null> = {}
      let changed = false
      for (let slotIndex = 0; slotIndex < CARD_SLOT_COUNT; slotIndex += 1) {
        const currentCardId = prev[slotIndex] ?? null
        if (currentCardId === cardId) {
          next[slotIndex] = null
          changed = true
        } else {
          next[slotIndex] = currentCardId
        }
      }
      return changed ? next : prev
    })
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
    if (newCardCategory === 'prompt') {
      setNewTag('PROMPT')
      setNewTitle('TINY REFLECTION')
      setNewBody('WHAT WOULD MAKE YOUR NEXT 10 MINUTES BETTER?')
      return
    }
    setNewTag('BODY\nRESET')
    setNewTitle('REACTION TEST')
    setNewBody('TAP YOUR DESK 5 TIMES AS EVENLY AS POSSIBLE.')
  }

  return (
    <main className={`app ${isCute ? 'app--cute' : 'app--stealth'}`}>
      {isCute ? (
        <div
          style={{
            alignItems: 'center',
            backgroundImage: 'url(https://workers.paper.design/file-assets/01KJCTWWPH70B7ATMDVTG9X3TK/01KJQFRX9ZX4NZB2GGMRGVH4SR.jpg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100dvh',
            justifyContent: 'space-between',
            overflow: isMobileLayout ? 'auto' : 'clip',
            paddingInline: 0,
            paddingTop: isMobileLayout ? 18 : 0,
            paddingBottom: isMobileLayout ? 24 : 0,
            position: 'relative',
            width: '100%',
          }}
        >
          <HalftoneCmyk
            size={0.21}
            gridNoise={0.01}
            type="ink"
            softness={1}
            contrast={2}
            gainC={0.3}
            gainM={0}
            gainY={0.2}
            gainK={0}
            floodC={0.15}
            floodM={0}
            floodY={0}
            floodK={0}
            scale={1}
            image="https://workers.paper.design/file-assets/01KJCTWWPH70B7ATMDVTG9X3TK/01KJR33NYZTXGP0FRQV8S9QVKM.jpg"
            grainSize={0.5}
            fit="cover"
            colorBack="#00000000"
            colorC="#00B4FF"
            colorM="#FC519F"
            colorY="#FFD800"
            colorK="#231F20"
            style={{ backgroundColor: '#FBFAF5', height: '1081px', left: 0, position: 'absolute', top: 0, width: '100%' }}
          />
          <div
            className="cute-shell"
            style={{
              alignItems: 'center',
              boxSizing: 'border-box',
              display: 'flex',
              gap: 373,
              height: isMobileLayout ? 'auto' : '100%',
              justifyContent: 'center',
              position: 'relative',
              paddingInline: isMobileLayout ? 12 : 0,
              paddingBlock: isMobileLayout ? 8 : 0,
              width: '100%',
            }}
          >
            <div
              className="cute-device-frame"
              style={{
                flexShrink: 0,
                height: `${cuteFrameHeight}px`,
                marginInline: 'auto',
                overflow: 'visible',
                position: 'relative',
                width: `${cuteFrameWidth}px`,
              }}
            >
            <section
              className={`cute-device ${isCuteCollapsed ? 'cute-device--collapsed' : ''} ${isAllCardsPawSorted ? 'cute-device--all-sorted' : ''}`.trim()}
              style={{
                backdropFilter: 'blur(36px)',
                backgroundColor: '#FFFFFF33',
                border: '1px solid #FFFFFF',
                boxSizing: 'border-box',
                filter: 'blur(0.4px)',
                height: '727px',
                outline: '4px solid #EEEEEE80',
                outlineOffset: '3px',
                overflow: 'clip',
                left: 0,
                position: 'absolute',
                top: 0,
                transform: `scale(${cuteDeviceScale})`,
                transformOrigin: 'top left',
                width: '662px',
              }}
            >
              <div className="cute-device-blur-mask" aria-hidden="true" style={{ backdropFilter: 'blur(16px)', filter: 'blur(6px)', height: '744px', left: 0, opacity: 1, outline: '1px solid #000000', position: 'absolute', top: 0, width: '662px' }} />
              <div
                className="cute-device-line-haze"
                aria-hidden="true"
                style={{
                  backgroundImage:
                    'url(https://workers.paper.design/file-assets/01KJCTWWPH70B7ATMDVTG9X3TK/01KJCZK38DCBFHX9DGAQR798XG.png)',
                  backgroundPosition: '50% 0%',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '100.302% auto',
                  boxSizing: 'border-box',
                  filter: 'saturate(263%)',
                  height: '44px',
                  left: 0,
                  opacity: '40%',
                  position: 'absolute',
                  top: 0,
                  width: '662px',
                }}
              />
            <header className="cute-status-bar" style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', gap: 210, height: 'fit-content', justifyContent: 'space-between', left: 11, paddingBlock: 0, paddingInline: 0, position: 'absolute', top: 9, width: '634px' }}>
              <span className="cute-signal" style={{ boxSizing: 'border-box', color: '#FFFFFF', flexShrink: 0, fontSize: '17px', height: 'fit-content', lineHeight: '22px', width: 'fit-content' }}>HYPE CAT</span>
              <div className="cute-status-meta" style={{ alignItems: 'flex-start', boxSizing: 'border-box', display: 'flex', flexShrink: 0, gap: 24, height: 'fit-content', justifyContent: 'flex-start', paddingBlock: 0, paddingInline: 0, width: 'fit-content' }}>
                <span className="cute-time" style={{ boxSizing: 'border-box', color: '#FFFFFF', flexShrink: 0, fontSize: '17px', fontWeight: 700, height: 'fit-content', lineHeight: '22px', width: 'fit-content' }}>{timeLabel}</span>
                <span className="cute-date" style={{ boxSizing: 'border-box', color: '#FFFFFF', flexShrink: 0, fontSize: '17px', fontWeight: 700, height: 'fit-content', lineHeight: '22px', width: 'fit-content' }}>{dateLabel}</span>
                <span className="cute-status-icons" style={{ alignItems: 'center', boxSizing: 'border-box', display: 'flex', flexShrink: 0, gap: 14, height: 'fit-content', paddingBlock: 0, paddingInline: 0, width: 'fit-content' }}>
                  <span className="cute-icon cute-icon--sun">
                    <span className="cute-icon--sun-dot" />
                  </span>
                  <span
                    className={`cute-battery-wrap ${isBatteryOverlayOpen ? 'is-open' : ''}`.trim()}
                    onMouseEnter={() => setIsBatteryOverlayOpen(true)}
                    onMouseLeave={() => setIsBatteryOverlayOpen(false)}
                  >
                    <button
                      type="button"
                      className="cute-battery-button"
                      aria-label="Show battery values"
                      aria-expanded={isBatteryOverlayOpen}
                      onFocus={() => setIsBatteryOverlayOpen(true)}
                      onBlur={() => setIsBatteryOverlayOpen(false)}
                      onClick={() => setIsBatteryOverlayOpen((open) => !open)}
                    >
                      <span
                        className="cute-battery"
                        style={{
                          backgroundImage: 'url(https://workers.paper.design/file-assets/01KJCTWWPH70B7ATMDVTG9X3TK/01KJCZWG1HYX8X90236D0QNG1M.png)',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'cover',
                          boxSizing: 'border-box',
                          flexShrink: 0,
                          height: '16.5px',
                          width: '28px',
                        }}
                      />
                    </button>
                    <div className={`cute-battery-popup ${isBatteryOverlayOpen ? 'is-open' : ''}`.trim()} role="status" aria-live="polite">
                      <span className="cute-battery-popup__arrow" aria-hidden="true" />
                      <p>BATTERY VALUES</p>
                      <div className="cute-battery-popup__group">
                        <div className="cute-battery-popup__item">
                          <div className="cute-battery-popup__row">
                            <span>SOCIAL</span>
                            <strong>{socialBattery}%</strong>
                          </div>
                          <span className="cute-battery-popup__line">
                            <span className="cute-battery-popup__fill cute-battery-popup__fill--social" style={{ width: meterWidth(socialBattery) }} />
                          </span>
                        </div>
                        <div className="cute-battery-popup__item">
                          <div className="cute-battery-popup__row">
                            <span>SLEEP</span>
                            <strong>{sleepBattery}%</strong>
                          </div>
                          <span className="cute-battery-popup__line">
                            <span className="cute-battery-popup__fill cute-battery-popup__fill--sleep" style={{ width: meterWidth(sleepBattery) }} />
                          </span>
                        </div>
                        <div className="cute-battery-popup__item">
                          <div className="cute-battery-popup__row">
                            <span>ATTENTION</span>
                            <strong>{attentionBattery}%</strong>
                          </div>
                          <span className="cute-battery-popup__line">
                            <span className="cute-battery-popup__fill cute-battery-popup__fill--attention" style={{ width: meterWidth(attentionBattery) }} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </span>
                </span>
              </div>
            </header>

                <section
                  className={`cute-card-grid ${isAllCardsPawSorted ? 'cute-card-grid--empty' : ''}`.trim()}
                  aria-label="Break cards"
                  style={{
                    alignItems: 'start',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    height: isAllCardsPawSorted ? '683px' : 'fit-content',
                    left: isAllCardsPawSorted ? 0 : 9,
                    paddingBlock: 0,
                    paddingInline: 0,
                    position: 'absolute',
                    top: isAllCardsPawSorted ? 44 : 59,
                    width: isAllCardsPawSorted ? '662px' : '641px',
                  }}
                >
                    {isAllCardsPawSorted ? (
                      <article className="cute-empty" aria-live="polite">
                        <p>ALL CARDS PAW-SORTED.</p>
                      </article>
                    ) : (
                      visibleSlots.map((slot, index) => {
                        const card = slot.card
                        if (!card) {
                          const minutesLeft =
                            slot.cooldownUntil === null ? 0 : Math.max(1, Math.ceil((slot.cooldownUntil - nowMs) / 60000))
                          return (
                            <article
                              key={`empty-slot-${index}`}
                              className={`cute-card cute-card--empty-slot ${slot.cooldownUntil ? 'cute-card--cooling' : ''}`.trim()}
                              aria-label={`Card slot ${index + 1} empty`}
                            >
                              {slot.cooldownUntil ? (
                                <div className="cute-cooling-surface">
                                  <PerlinNoise
                                    speed={0.5}
                                    scale={1}
                                    proportion={0.35}
                                    softness={0.1}
                                    octaveCount={1}
                                    lacunarity={1.5}
                                    persistence={1}
                                    colorBack="#00000000"
                                    colorFront="#FCCFF7"
                                    style={{ backgroundColor: '#632AD5', height: '100%', left: 0, opacity: '10%', position: 'absolute', top: 0, width: '100%' }}
                                  />
                                  <div className="cute-cooling-content">
                                    <div className="cute-cooling-copy">
                                      <p className="cute-cooling-title">SLOT COOLING</p>
                                      <p className="cute-cooling-subtitle">{`REFILLS IN ${minutesLeft}M`}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p>No cards queued</p>
                              )}
                            </article>
                          )
                        }
                        return (
                          <article
                            key={card.id}
                            className={`cute-card ${(votes[card.id] ?? 0) !== 0 ? 'cute-card--focus' : ''} ${removingCardId === card.id ? 'cute-card--removing' : ''}`.trim()}
                            aria-label={`Card ${index + 1}`}
                            style={{
                              boxSizing: 'border-box',
                              flexShrink: 0,
                              height: '100px',
                              position: 'relative',
                              width: '100%',
                            }}
                          >
                            <div className={`cute-card-reveal ${removingCardId === card.id ? 'cute-card-reveal--visible' : ''}`.trim()}>
                              {removalDirection === 1 ? 'PAW UP LOGGED' : 'PAW DOWN LOGGED'}
                            </div>
                            <div
                              className="cute-card-surface"
                              style={{
                                backgroundColor: '#FFFFFF80',
                                boxSizing: 'border-box',
                                height: '100px',
                                left: 0,
                                outline: '2px solid #FFFFFF',
                                overflow: 'clip',
                                position: 'absolute',
                                top: 0,
                                width: '100%',
                              }}
                            >
                              <div className="cute-card-top" aria-hidden="true" style={{ boxSizing: 'border-box', height: '100%', left: 0, position: 'absolute', top: 0, width: '100px' }}>
                                {card.tag.split('\n').map((line) => (
                                  <span key={line} style={{ boxSizing: 'border-box', color: '#000000', fontSize: '14px', left: 8, letterSpacing: '-0.1em', lineHeight: '1.1', position: 'relative', top: 9, width: '54px', whiteSpace: 'pre-wrap' }}>{line}</span>
                                ))}
                              </div>
                              <div
                                className="cute-card-content"
                                style={{
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                }}
                              >
                                <h3>{card.title}</h3>
                                <p>{card.body}</p>
                              </div>
                              <div className="cute-actions cute-actions--paws" style={{ alignItems: 'end', boxSizing: 'border-box', display: 'flex', gap: '23px', height: 'fit-content', left: index === 0 ? 493 : index === 1 ? 476 : undefined, paddingBlock: 0, paddingInline: 0, position: 'absolute', top: index === 0 ? 25 : 24, width: 'fit-content' }}>
                                <button
                                  type="button"
                                  aria-label={`Upvote ${card.title}`}
                                  title="Paw up"
                                  aria-pressed={(votes[card.id] ?? 0) === 1}
                                  disabled={Boolean(removingCardId)}
                                  onClick={() => handleVote(card.id, 1)}
                                >
                                  <span className="cute-paw-glow" aria-hidden="true" />
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
                                  <span className="cute-paw-glow" aria-hidden="true" />
                                  <img src={card.paws[1]} alt="" />
                                </button>
                              </div>
                            </div>
                          </article>
                        )
                      })
                    )}
                </section>

                {!isAllCardsPawSorted ? <div className="cute-bottom-whitespace" aria-hidden="true" /> : null}

                {!isAllCardsPawSorted ? (
                <footer className="cute-bottom-strip" style={{ alignItems: 'flex-end', boxSizing: 'border-box', display: 'flex', flexWrap: 'nowrap', gap: '6px', height: '97px', left: 0, paddingLeft: '14px', paddingRight: '12px', position: 'absolute', top: 614, width: '662px' }}>
                  <div className="cute-radio" aria-live="polite" style={{ backgroundColor: '#FFFFFF80', borderColor: '#B8BEC8', borderStyle: 'solid', borderWidth: '1px', boxShadow: '#FFFFFF73 1px 1px 0px inset', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '97px', width: '386px' }}>
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

                    <div className="cute-radio__lower" style={{ alignItems: 'flex-end', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', paddingLeft: '10px', paddingRight: '10px', paddingTop: '7px', width: '100%' }}>
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
                  <span className="cute-weather" style={{ display: 'none' }}>
                    <img src={weather.iconSrc} alt={weather.label} title={weather.label} />
                    <span className="cute-weather-inline">{`${weatherTemperatureLabel} • ${weather.label}`}</span>
                    <span className="cute-weather-popup">{`${weatherTemperatureLabel} • ${weather.label}`}</span>
                  </span>
                  <div className="cute-mini-calendar" style={{ backgroundColor: '#FFFFFF80', borderColor: '#B6B6B6', borderStyle: 'solid', borderWidth: '1px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '97px', justifyContent: 'space-between', paddingBottom: '9px', paddingLeft: '8px', paddingRight: '8px', paddingTop: '8px', width: '236px' }}>
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
                ) : null}
          </section>
          </div>
          </div>
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

            <section className="stealth-meta" aria-label="Battery status">
              <p className="stealth-battery-label">Battery Approx</p>
              <div className="stealth-battery-cluster">
                <article className="stealth-battery-card">
                  <span>Social</span>
                  <div className="stealth-battery-row">
                    <span className="stealth-battery-meter" aria-hidden="true">
                      <span className="stealth-battery-fill" style={{ width: meterWidth(socialBattery) }} />
                    </span>
                    <strong className="stealth-battery-value">{socialBattery}%</strong>
                  </div>
                </article>
                <article className="stealth-battery-card">
                  <span>Sleep</span>
                  <div className="stealth-battery-row">
                    <span className="stealth-battery-meter" aria-hidden="true">
                      <span className="stealth-battery-fill" style={{ width: meterWidth(sleepBattery) }} />
                    </span>
                    <strong className="stealth-battery-value">{sleepBattery}%</strong>
                  </div>
                </article>
                <article className="stealth-battery-card">
                  <span>Attention</span>
                  <div className="stealth-battery-row">
                    <span className="stealth-battery-meter" aria-hidden="true">
                      <span className="stealth-battery-fill" style={{ width: meterWidth(attentionBattery) }} />
                    </span>
                    <strong className="stealth-battery-value">{attentionBattery}%</strong>
                  </div>
                </article>
              </div>
            </section>

            <section className="stealth-results" aria-label="Stealth cards">
              {visibleSlots.map((slot, index) => {
                const card = slot.card
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
        <span className={`mode-label ${!isCute ? 'mode-label--active' : ''}`.trim()} style={isCute ? { boxSizing: 'border-box', color: '#000000', flexShrink: 0, fontSize: '16px', height: 'fit-content', lineHeight: '20px', textTransform: 'uppercase', whiteSpace: 'nowrap', width: 'fit-content' } : undefined}>STEALTH</span>
        <span className={`mode-toggle ${isCute ? 'mode-toggle--right' : 'mode-toggle--left'}`} aria-hidden style={isCute ? { boxSizing: 'border-box', flexShrink: 0, height: '27px', position: 'relative', width: '56px', border: '1px solid #00000033', background: '#FFFFFFCC' } : undefined}>
          <span className="mode-toggle__knob" style={isCute ? { backgroundColor: '#000000', boxSizing: 'border-box', height: '14px', position: 'absolute', right: 9, top: 7, width: '14px', border: 0 } : undefined} />
        </span>
        <span className={`mode-label ${isCute ? 'mode-label--active' : ''}`.trim()} style={isCute ? { boxSizing: 'border-box', color: '#FF0005', flexShrink: 0, fontSize: '16px', fontWeight: 700, height: 'fit-content', lineHeight: '20px', textTransform: 'uppercase', whiteSpace: 'nowrap', width: 'fit-content' } : undefined}>CUTE</span>
      </div>

      {!isCute || !isAllCardsPawSorted ? (
        <button type="button" className="open-sheet" onClick={() => setIsSheetOpen(true)}>
          Card manager
        </button>
      ) : null}

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
              <h3>Prompt cards</h3>
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
                  {promptCards.map((card) => (
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
                  {promptCards.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No prompt cards yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="sheet-table-wrap">
              <h3>Exercise and reset cards</h3>
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
                  {standardCards.map((card) => (
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
                  {standardCards.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No standard cards yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <footer className="sheet-footer">
              <p>Add a new card to both CUTE and STEALTH lists.</p>
              <div className="sheet-add-row">
                <select value={newCardCategory} onChange={(e) => setNewCardCategory(e.target.value as 'standard' | 'prompt')}>
                  <option value="standard">Exercise / reset</option>
                  <option value="prompt">Prompt</option>
                </select>
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
