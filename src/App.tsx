import { useEffect, useMemo, useState } from 'react'

type Mode = 'cute' | 'stealth'
type Vote = 'up' | 'down'
type CardType = 'body_reset' | 'mind_snack' | 'micro_game' | 'status_nudge'

type CardData = {
  id: string
  title: string
  body: string
  type: CardType
}

type CardSlot = {
  slotId: string
  card: CardData | null
  state: 'active' | 'removing' | 'empty'
  vote?: Vote
}

type Feedback = Record<CardType, { up: number; down: number }>

type MiniGameProgress = {
  reactionTaps: number
  catFound: boolean
  catX: number
  catY: number
}

type MiniGameState = Record<string, MiniGameProgress>

type SessionState = {
  slots: CardSlot[]
  miniGames: MiniGameState
}

type LayoutProps = {
  cooldownLeft: number
  cooldownActive: boolean
  votedCards: number
  sessionEnded: boolean
  slots: CardSlot[]
  miniGames: MiniGameState
  onVote: (slotId: string, vote: Vote) => void
  isVoteEnabled: (slot: CardSlot) => boolean
  promptInputs: Record<string, string>
  onPromptInputChange: (slotId: string, value: string) => void
  onReactionTap: (slotId: string) => void
  onFindCat: (slotId: string) => void
  onRefreshNow: () => void
  onSkipCooldown: () => void
  onToggleMode: () => void
}

type NewCardDraft = {
  type: Exclude<CardType, 'micro_game'>
  title: string
  body: string
}

const COOLDOWN_SECONDS = 20 * 60
const SLOT_COUNT = 3
const MODE_KEY = 'hypecat:mode'
const FEEDBACK_KEY = 'hypecat:feedback'
const CARDS_KEY = 'hypecat:cards'

const INITIAL_CARD_POOL: CardData[] = [
  {
    id: 'hydrate-1',
    title: 'Hydration Ping',
    body: 'Take 3 small sips of water right now.',
    type: 'body_reset',
  },
  {
    id: 'stretch-1',
    title: 'Desk Stretch',
    body: 'Roll shoulders back 5 times and unclench your jaw.',
    type: 'body_reset',
  },
  {
    id: 'fact-1',
    title: 'Mind Snack',
    body: 'Octopuses have three hearts. Pick one weird fact to share later.',
    type: 'mind_snack',
  },
  {
    id: 'prompt-1',
    title: 'Micro Prompt',
    body: 'What is one tiny win from today? Name it in 5 words.',
    type: 'mind_snack',
  },
  {
    id: 'game-1',
    title: 'Reaction Test',
    body: 'Tap the button 5 times to unlock voting.',
    type: 'micro_game',
  },
  {
    id: 'game-2',
    title: 'Find The Cat',
    body: 'Find and tap the hidden cat to unlock voting.',
    type: 'micro_game',
  },
  {
    id: 'task-1',
    title: 'Status Nudge',
    body: 'Queue the next work task in one sentence.',
    type: 'status_nudge',
  },
  {
    id: 'task-2',
    title: 'Posture Check',
    body: 'Feet flat, shoulders down, neck long. Hold for 10 seconds.',
    type: 'status_nudge',
  },
]

const FEEDBACK_BASE: Feedback = {
  body_reset: { up: 0, down: 0 },
  mind_snack: { up: 0, down: 0 },
  micro_game: { up: 0, down: 0 },
  status_nudge: { up: 0, down: 0 },
}

const randomizeCards = (cards: CardData[]): CardData[] => {
  const source = cards.length > 0 ? cards : INITIAL_CARD_POOL
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  if (shuffled.length >= SLOT_COUNT) {
    return shuffled.slice(0, SLOT_COUNT)
  }

  const filled = [...shuffled]
  while (filled.length < SLOT_COUNT) {
    filled.push(shuffled[filled.length % shuffled.length])
  }
  return filled
}

const makeInitialSlots = (cards: CardData[]): CardSlot[] => {
  const picked = randomizeCards(cards)
  return picked.map((card, index) => ({
    slotId: `slot-${index + 1}`,
    card,
    state: 'active',
  }))
}

const makeMiniGameState = (slots: CardSlot[]): MiniGameState => {
  return slots.reduce<MiniGameState>((acc, slot) => {
    acc[slot.slotId] = {
      reactionTaps: 0,
      catFound: false,
      catX: 8 + Math.floor(Math.random() * 72),
      catY: 14 + Math.floor(Math.random() * 62),
    }
    return acc
  }, {})
}

const createSessionState = (cards: CardData[]): SessionState => {
  const slots = makeInitialSlots(cards)
  return {
    slots,
    miniGames: makeMiniGameState(slots),
  }
}

const formatClock = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const formatType = (type: CardType): string => {
  return type.replace('_', ' ')
}

const isMicroPrompt = (card: CardData): boolean => card.id === 'prompt-1'
const isReactionGame = (card: CardData): boolean => card.id === 'game-1'
const isFindCatGame = (card: CardData): boolean => card.id === 'game-2'

const readMode = (): Mode => {
  const saved = window.localStorage.getItem(MODE_KEY)
  return saved === 'cute' || saved === 'stealth' ? saved : 'cute'
}

const readFeedback = (): Feedback => {
  const raw = window.localStorage.getItem(FEEDBACK_KEY)
  if (!raw) {
    return FEEDBACK_BASE
  }

  try {
    const parsed = JSON.parse(raw) as Feedback
    return {
      body_reset: parsed.body_reset ?? FEEDBACK_BASE.body_reset,
      mind_snack: parsed.mind_snack ?? FEEDBACK_BASE.mind_snack,
      micro_game: parsed.micro_game ?? FEEDBACK_BASE.micro_game,
      status_nudge: parsed.status_nudge ?? FEEDBACK_BASE.status_nudge,
    }
  } catch {
    return FEEDBACK_BASE
  }
}

const readCardLibrary = (): CardData[] => {
  const raw = window.localStorage.getItem(CARDS_KEY)
  if (!raw) {
    return INITIAL_CARD_POOL
  }

  try {
    const parsed = JSON.parse(raw) as CardData[]
    const valid = parsed.filter((card) => {
      return (
        typeof card.id === 'string' &&
        typeof card.title === 'string' &&
        typeof card.body === 'string' &&
        ['body_reset', 'mind_snack', 'micro_game', 'status_nudge'].includes(card.type)
      )
    })
    return valid.length > 0 ? valid : INITIAL_CARD_POOL
  } catch {
    return INITIAL_CARD_POOL
  }
}

function CardSpreadsheetManager({
  cards,
  draft,
  onDraftChange,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onClose,
}: {
  cards: CardData[]
  draft: NewCardDraft
  onDraftChange: (next: NewCardDraft) => void
  onAddCard: () => void
  onUpdateCard: (id: string, field: 'type' | 'title' | 'body', value: string) => void
  onDeleteCard: (id: string) => void
  onClose: () => void
}) {
  return (
    <section className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Card spreadsheet manager">
      <div className="sheet-modal">
        <header className="sheet-header">
          <h2>Card Spreadsheet</h2>
          <button onClick={onClose}>Close</button>
        </header>

        <div className="sheet-table-wrap">
          <table className="sheet-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Body</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id}>
                  <td>
                    <select value={card.type} onChange={(event) => onUpdateCard(card.id, 'type', event.target.value)}>
                      <option value="body_reset">body reset</option>
                      <option value="mind_snack">mind snack</option>
                      <option value="micro_game">micro game</option>
                      <option value="status_nudge">status nudge</option>
                    </select>
                  </td>
                  <td>
                    <input value={card.title} onChange={(event) => onUpdateCard(card.id, 'title', event.target.value)} />
                  </td>
                  <td>
                    <input value={card.body} onChange={(event) => onUpdateCard(card.id, 'body', event.target.value)} />
                  </td>
                  <td>
                    <button onClick={() => onDeleteCard(card.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="sheet-footer">
          <p>Add new cards for body reset, mind snack, and status nudge.</p>
          <div className="sheet-add-row">
            <select
              value={draft.type}
              onChange={(event) =>
                onDraftChange({
                  ...draft,
                  type: event.target.value as Exclude<CardType, 'micro_game'>,
                })
              }
            >
              <option value="body_reset">body reset</option>
              <option value="mind_snack">mind snack</option>
              <option value="status_nudge">status nudge</option>
            </select>
            <input
              placeholder="New title"
              value={draft.title}
              onChange={(event) => onDraftChange({ ...draft, title: event.target.value })}
            />
            <input
              placeholder="New body text"
              value={draft.body}
              onChange={(event) => onDraftChange({ ...draft, body: event.target.value })}
            />
            <button onClick={onAddCard} disabled={!draft.title.trim() || !draft.body.trim()}>
              Add card
            </button>
          </div>
        </footer>
      </div>
    </section>
  )
}

function CuteLayout({
  cooldownLeft,
  cooldownActive,
  sessionEnded,
  slots,
  miniGames,
  onVote,
  isVoteEnabled,
  promptInputs,
  onPromptInputChange,
  onReactionTap,
  onFindCat,
  onSkipCooldown,
  onToggleMode,
}: LayoutProps) {
  return (
    <div className="cute-shell">
      <section className="cute-device">
        <header className="cute-status-bar">
          <span className="cute-signal">HYPE CAT</span>
          <span className="cute-time">{sessionEnded ? formatClock(cooldownLeft) : '15:58'}</span>
          <span className="cute-date">07/20</span>
          <span className="cute-icon cute-icon--orange" aria-hidden="true">
            ▬
          </span>
          <span className="cute-icon cute-icon--mono" aria-hidden="true">
            M
          </span>
          <span className="cute-battery" aria-hidden="true">
            <img src="/ui-battery.png" alt="" />
          </span>
        </header>

        {sessionEnded ? (
          <section className="cute-ended" aria-live="polite">
            <h2>Session ended.</h2>
            <p>Cooldown: {formatClock(cooldownLeft)}</p>
            {cooldownActive && (
              <button className="skip-button" onClick={onSkipCooldown}>
                Skip cooldown (dev)
              </button>
            )}
          </section>
        ) : (
          <section className="cute-card-grid" aria-label="Break cards">
            {slots.map((slot, index) => {
              const canVote = isVoteEnabled(slot)
              const game = miniGames[slot.slotId]

              return (
                <article
                  key={slot.slotId}
                  className={`cute-card cute-card--${slot.state} ${index === 2 ? 'cute-card--focus' : ''}`}
                  aria-label={`Card slot ${index + 1}`}
                >
                  {slot.card ? (
                    <>
                      <div className="cute-card-top">
                        <span>{formatType(slot.card.type)}</span>
                      </div>
                      <h3>{slot.card.title}</h3>
                      <p>{slot.card.body}</p>
                      {isMicroPrompt(slot.card) && (
                        <input
                          className="micro-input micro-input--cute"
                          type="text"
                          value={promptInputs[slot.slotId] ?? ''}
                          onChange={(event) => onPromptInputChange(slot.slotId, event.target.value)}
                          maxLength={36}
                          placeholder="tiny answer..."
                        />
                      )}
                      {isReactionGame(slot.card) && (
                        <div className="mini-widget mini-widget--hidden">
                          <span>{Math.min(game?.reactionTaps ?? 0, 5)}/5</span>
                          <button
                            onClick={() => onReactionTap(slot.slotId)}
                            disabled={slot.state !== 'active' || (game?.reactionTaps ?? 0) >= 5}
                          >
                            Tap
                          </button>
                        </div>
                      )}
                      {isFindCatGame(slot.card) && (
                        <div className="mini-widget mini-widget--cat">
                          <div className="cat-field">
                            {!game?.catFound && (
                              <button
                                className="hidden-cat"
                                style={{ left: `${game?.catX ?? 40}%`, top: `${game?.catY ?? 45}%` }}
                                onClick={() => onFindCat(slot.slotId)}
                                disabled={slot.state !== 'active'}
                                aria-label="Find cat"
                              >
                                <img src="/paw-pink.png" alt="" />
                              </button>
                            )}
                          </div>
                          <span>{game?.catFound ? 'Cat found!' : 'Find cat to unlock vote'}</span>
                        </div>
                      )}
                      <div className="cute-actions">
                        <button onClick={() => onVote(slot.slotId, 'up')} disabled={slot.state !== 'active' || !canVote} aria-label="Paw up">
                          <img src="/paw-green.png" alt="" />
                        </button>
                        <button onClick={() => onVote(slot.slotId, 'down')} disabled={slot.state !== 'active' || !canVote} aria-label="Paw down">
                          <img src="/paw-pink.png" alt="" />
                        </button>
                      </div>
                      {slot.state === 'removing' && (
                        <div className="paw-swipe" aria-hidden="true">
                          <img src="/paw-pink.png" alt="" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="cute-empty">slot cleared</div>
                  )}
                </article>
              )
            })}
          </section>
        )}

        <div className="cute-bottom-whitespace" aria-hidden="true" />

        <footer className="cute-bottom-strip">
          <button className="cute-weather" type="button" aria-label="Weather">
            <img src="/ui-sun.png" alt="" />
          </button>
          <div className="cute-mini-calendar" aria-hidden="true">
            <p>07/2020</p>
            <div className="week-row">
              <span className="sun">Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span className="sat">Sa</span>
            </div>
          </div>
        </footer>

      </section>

      <div className="cute-mode-switch">
        <span>STEALTH</span>
        <button className="mode-toggle" onClick={onToggleMode} aria-label="Switch mode">
          <span className="mode-toggle__knob" />
        </button>
        <span>CUTE</span>
      </div>
    </div>
  )
}

function StealthLayout({
  cooldownLeft,
  cooldownActive,
  votedCards,
  sessionEnded,
  slots,
  miniGames,
  onVote,
  isVoteEnabled,
  promptInputs,
  onPromptInputChange,
  onReactionTap,
  onFindCat,
  onRefreshNow,
  onSkipCooldown,
  onToggleMode,
}: LayoutProps) {
  return (
    <section className="stealth-portal">
      <header className="stealth-header">
        <p className="stealth-brand">
          <span>S</span>-Lib™️
        </p>
        <p className="stealth-subline">Personal focus index. finite results only.</p>
      </header>

      <section className="stealth-search-tabs" aria-hidden="true">
        <span className="active">General Search</span>
        <span>Fulltext Search</span>
      </section>

      <section className="stealth-searchbar" aria-hidden="true">
        <input value="focus reset" readOnly />
        <button type="button">Search</button>
      </section>

      <section className="stealth-meta">
        <div className="meta-box">
          <span>{sessionEnded ? 'Cooldown left' : 'Session state'}</span>
          <strong>{sessionEnded ? formatClock(cooldownLeft) : 'ACTIVE'}</strong>
        </div>
        <div className="meta-box">
          <span>Votes complete</span>
          <strong>{votedCards}/3</strong>
        </div>
        <div className="meta-box">
          <span>Mode</span>
          <button onClick={onToggleMode}>Switch to Cute</button>
        </div>
        <div className="meta-box">
          <span>Action</span>
          <button onClick={onRefreshNow}>Refresh Now</button>
        </div>
      </section>

      {sessionEnded ? (
        <section className="stealth-ended" aria-live="polite">
          <h2>Session ended.</h2>
          <p>Next board in {formatClock(cooldownLeft)}.</p>
          {cooldownActive && (
            <button className="skip-button" onClick={onSkipCooldown}>
              Skip cooldown (dev)
            </button>
          )}
        </section>
      ) : (
        <section className="stealth-results" aria-label="Break cards">
          {slots.map((slot, index) => {
            const canVote = isVoteEnabled(slot)
            const game = miniGames[slot.slotId]

            return (
              <article key={slot.slotId} className={`stealth-row state-${slot.state}`}>
                <span className="row-index">{index + 1}</span>
                <div className="row-main">
                  <p className="row-title">{slot.card ? slot.card.title : 'Vote submitted'}</p>
                  <p className="row-type">{slot.card ? formatType(slot.card.type) : 'cleared'}</p>
                  <p className="row-body">{slot.card ? slot.card.body : 'This slot is complete for this session.'}</p>
                  {slot.card && isMicroPrompt(slot.card) && (
                    <input
                      className="micro-input micro-input--stealth"
                      type="text"
                      value={promptInputs[slot.slotId] ?? ''}
                      onChange={(event) => onPromptInputChange(slot.slotId, event.target.value)}
                      maxLength={36}
                      placeholder="brief note..."
                    />
                  )}
                  {slot.card && isReactionGame(slot.card) && (
                    <div className="mini-widget mini-widget--stealth">
                      <span>Tap count: {Math.min(game?.reactionTaps ?? 0, 5)}/5</span>
                      <button onClick={() => onReactionTap(slot.slotId)} disabled={slot.state !== 'active' || (game?.reactionTaps ?? 0) >= 5}>
                        Tap
                      </button>
                    </div>
                  )}
                  {slot.card && isFindCatGame(slot.card) && (
                    <div className="mini-widget mini-widget--stealth">
                      <div className="cat-field cat-field--stealth">
                        {!game?.catFound && (
                          <button
                            className="hidden-cat hidden-cat--stealth"
                            style={{ left: `${game?.catX ?? 40}%`, top: `${game?.catY ?? 45}%` }}
                            onClick={() => onFindCat(slot.slotId)}
                            disabled={slot.state !== 'active'}
                            aria-label="Find cat"
                          >
                            cat
                          </button>
                        )}
                      </div>
                      <span>{game?.catFound ? 'Cat located.' : 'Locate cat to unlock vote.'}</span>
                    </div>
                  )}
                </div>
                <div className="row-actions">
                  {slot.card ? (
                    <>
                      <button onClick={() => onVote(slot.slotId, 'up')} disabled={slot.state !== 'active' || !canVote}>
                        Approve
                      </button>
                      <button onClick={() => onVote(slot.slotId, 'down')} disabled={slot.state !== 'active' || !canVote}>
                        Deprioritize
                      </button>
                      {!canVote && slot.card.type === 'micro_game' && <span className="cleared">Complete mini-game first</span>}
                      {slot.state === 'removing' && (
                        <span className="stamp">{slot.vote === 'up' ? 'APPROVED' : 'DEPRIORITIZED'}</span>
                      )}
                    </>
                  ) : (
                    <span className="cleared">Done</span>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}

    </section>
  )
}

function App() {
  const [mode, setMode] = useState<Mode>(() => readMode())
  const [cooldownLeft, setCooldownLeft] = useState(COOLDOWN_SECONDS)
  const [cooldownActive, setCooldownActive] = useState(false)
  const [cardLibrary, setCardLibrary] = useState<CardData[]>(() => readCardLibrary())
  const [sessionState, setSessionState] = useState<SessionState>(() => createSessionState(readCardLibrary()))
  const [feedback, setFeedback] = useState<Feedback>(() => readFeedback())
  const [promptInputs, setPromptInputs] = useState<Record<string, string>>({})
  const [showManager, setShowManager] = useState(false)
  const [newCardDraft, setNewCardDraft] = useState<NewCardDraft>({
    type: 'body_reset',
    title: '',
    body: '',
  })

  const votedCards = useMemo(
    () => sessionState.slots.filter((slot) => slot.state === 'empty').length,
    [sessionState.slots],
  )
  const sessionEnded = votedCards === SLOT_COUNT

  useEffect(() => {
    window.localStorage.setItem(MODE_KEY, mode)
  }, [mode])

  useEffect(() => {
    window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback))
  }, [feedback])

  useEffect(() => {
    window.localStorage.setItem(CARDS_KEY, JSON.stringify(cardLibrary))
  }, [cardLibrary])

  useEffect(() => {
    if (sessionEnded && !cooldownActive) {
      setCooldownActive(true)
      setCooldownLeft(COOLDOWN_SECONDS)
    }
  }, [sessionEnded, cooldownActive])

  useEffect(() => {
    if (!cooldownActive) {
      return
    }

    const timer = window.setInterval(() => {
      setCooldownLeft((current) => {
        if (current <= 1) {
          setSessionState(createSessionState(cardLibrary))
          setPromptInputs({})
          setCooldownActive(false)
          return COOLDOWN_SECONDS
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [cooldownActive, cardLibrary])

  const isVoteEnabled = (slot: CardSlot): boolean => {
    if (!slot.card || slot.state !== 'active') {
      return false
    }

    if (slot.card.type !== 'micro_game') {
      return true
    }

    const progress = sessionState.miniGames[slot.slotId]
    if (!progress) {
      return false
    }

    if (isReactionGame(slot.card)) {
      return progress.reactionTaps >= 5
    }

    if (isFindCatGame(slot.card)) {
      return progress.catFound
    }

    return true
  }

  const handleVote = (slotId: string, vote: Vote) => {
    const slot = sessionState.slots.find((item) => item.slotId === slotId)
    if (!slot || !isVoteEnabled(slot)) {
      return
    }

    const card = slot.card
    if (!card) {
      return
    }

    const cardType = card.type
    setFeedback((current) => ({
      ...current,
      [cardType]: {
        ...current[cardType],
        [vote]: current[cardType][vote] + 1,
      },
    }))

    setSessionState((current) => ({
      ...current,
      slots: current.slots.map((item) =>
        item.slotId === slotId ? { ...item, state: 'removing', vote } : item,
      ),
    }))

    window.setTimeout(() => {
      setSessionState((current) => ({
        ...current,
        slots: current.slots.map((item) =>
          item.slotId === slotId ? { ...item, card: null, state: 'empty' } : item,
        ),
      }))
    }, 550)
  }

  const refreshNow = () => {
    setSessionState(createSessionState(cardLibrary))
    setCooldownLeft(COOLDOWN_SECONDS)
    setCooldownActive(false)
    setPromptInputs({})
  }

  const skipCooldown = () => {
    if (!cooldownActive) {
      return
    }

    setSessionState(createSessionState(cardLibrary))
    setCooldownLeft(COOLDOWN_SECONDS)
    setCooldownActive(false)
    setPromptInputs({})
  }

  const layoutProps: LayoutProps = {
    cooldownLeft,
    cooldownActive,
    votedCards,
    sessionEnded,
    slots: sessionState.slots,
    miniGames: sessionState.miniGames,
    onVote: handleVote,
    isVoteEnabled,
    promptInputs,
    onPromptInputChange: (slotId: string, value: string) =>
      setPromptInputs((current) => ({ ...current, [slotId]: value })),
    onReactionTap: (slotId: string) =>
      setSessionState((current) => ({
        ...current,
        miniGames: {
          ...current.miniGames,
          [slotId]: {
            ...current.miniGames[slotId],
            reactionTaps: Math.min((current.miniGames[slotId]?.reactionTaps ?? 0) + 1, 5),
          },
        },
      })),
    onFindCat: (slotId: string) =>
      setSessionState((current) => ({
        ...current,
        miniGames: {
          ...current.miniGames,
          [slotId]: {
            ...current.miniGames[slotId],
            catFound: true,
          },
        },
      })),
    onRefreshNow: refreshNow,
    onSkipCooldown: skipCooldown,
    onToggleMode: () => setMode((current) => (current === 'cute' ? 'stealth' : 'cute')),
  }

  return (
    <main className={`app app--${mode}`}>
      {mode === 'cute' ? <CuteLayout {...layoutProps} /> : <StealthLayout {...layoutProps} />}
      <button className="open-sheet" onClick={() => setShowManager(true)}>
        Manage Cards
      </button>
      {showManager && (
        <CardSpreadsheetManager
          cards={cardLibrary}
          draft={newCardDraft}
          onDraftChange={setNewCardDraft}
          onAddCard={() => {
            const title = newCardDraft.title.trim()
            const body = newCardDraft.body.trim()
            if (!title || !body) {
              return
            }

            setCardLibrary((current) => [
              ...current,
              {
                id: `custom-${Date.now()}`,
                type: newCardDraft.type,
                title,
                body,
              },
            ])
            setNewCardDraft((current) => ({ ...current, title: '', body: '' }))
          }}
          onUpdateCard={(id, field, value) => {
            setCardLibrary((current) =>
              current.map((card) =>
                card.id === id
                  ? {
                      ...card,
                      [field]:
                        field === 'type'
                          ? (value as CardType)
                          : value,
                    }
                  : card,
              ),
            )
          }}
          onDeleteCard={(id) => {
            setCardLibrary((current) => {
              const next = current.filter((card) => card.id !== id)
              return next.length > 0 ? next : current
            })
          }}
          onClose={() => setShowManager(false)}
        />
      )}
    </main>
  )
}

export default App
