import type { Card, RadioSong, RadioStation } from './types'

export const PAW_SETS = {
  greenRed: ['/paw-green.png', '/paw-red.png'],
  redGreen: ['/paw-red.png', '/paw-green.png'],
}

export const CARDS: Card[] = [
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

export const MINI_ARCADE_CARDS: Card[] = [
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

export const MINI_PROMPT_CARDS: Card[] = [
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

export const CARD_SLOT_COUNT = 3
export const VOTED_SLOT_COOLDOWN_MS = 20 * 60 * 1000
export const CARDS_STORAGE_KEY = 'hypecat.cards'
export const MINI_ARCADE_CARDS_STORAGE_KEY = 'hypecat.miniArcadeCards'
export const MINI_PROMPTS_STORAGE_KEY = 'hypecat.miniPrompts'
export const SLOT_COOLDOWN_STORAGE_KEY = 'hypecat.slotCooldownUntil'
export const CARD_SELECTION_SEED_STORAGE_KEY = 'hypecat.cardSelectionSeed'
export const RADIO_SESSION_STORAGE_KEY = 'hypecat.radioSession'

export const MEMORY_SYMBOLS = ['P', 'P', 'C', 'C', 'R', 'R', 'M', 'M'] as const

export const MINI_PROMPTS = [
  'What is one tiny win from today?',
  'What would make the next 10 minutes easier?',
  'Name one thing you can simplify right now.',
  'What is your next concrete action?',
  'What are you curious about in this task?',
  'What would future-you thank you for?',
] as const

export const RADIO_LIBRARY: RadioSong[] = [
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

export const RADIO_STATIONS: RadioStation[] = [
  { id: 'hype', name: 'HYPE FM', position: 0.2, songIndexes: [0, 1], allowsUploads: true },
  { id: 'night', name: 'NITE FM', position: 0.78, songIndexes: [2], allowsUploads: false },
]

export const RADIO_TUNE_THRESHOLD = 0.065
