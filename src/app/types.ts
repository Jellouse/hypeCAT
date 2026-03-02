export type Card = {
  id: string
  tag: string
  title: string
  body: string
  paws: string[]
}

export type RadioSong = {
  title: string
  bpm: number
  notes: Array<number | null>
}

export type UploadedTune = {
  title: string
  file: string
}

export type RadioStation = {
  id: 'hype' | 'night'
  name: string
  position: number
  songIndexes: number[]
  allowsUploads: boolean
}

export type UploadedTunesByStation = Record<RadioStation['id'], UploadedTune[]>

export type PersistedStationRadioState =
  | { mode: 'uploads'; uploadedTrackIndex: number; uploadedTimeSec: number }
  | { mode: 'synth'; songIndex: number; noteIndex: number }

export type PersistedRadioSessionByStation = Partial<Record<RadioStation['id'], PersistedStationRadioState>>

export type WeatherSnapshot = {
  iconSrc: string
  label: string
  temperatureC: number | null
}

export type CardSlot = {
  card: Card | null
  cooldownUntil: number | null
}

export type MemoryTile = {
  id: number
  value: string
  matched: boolean
}

export type MiniCardId = 'pong' | 'flappy' | 'memory'
