const BASE = `http://localhost:${process.env.FIBA_LIVESTATS_PORT ?? '8084'}`
const TIMEOUT_MS = 3000

async function fibaFetch<T>(path: string): Promise<T | null> {
  if (process.env.FIBA_LIVESTATS_ENABLED !== 'true') return null
  try {
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const res = await fetch(`${BASE}${path}`, { signal: ctrl.signal, cache: 'no-store' })
    clearTimeout(tid)
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

export async function fibaIsOnline(): Promise<boolean> {
  const data = await fibaFetch<unknown>('/api/status')
  return data !== null
}

export async function fibaGetGames(): Promise<FibaGame[] | null> {
  return fibaFetch<FibaGame[]>('/api/games')
}

export async function fibaGetGameState(fixtureId: string): Promise<FibaGameState | null> {
  return fibaFetch<FibaGameState>(`/api/games/${fixtureId}`)
}

export async function fibaGetBoxScore(fixtureId: string): Promise<FibaBoxScore | null> {
  return fibaFetch<FibaBoxScore>(`/api/games/${fixtureId}/boxscore`)
}

export async function fibaGetActions(fixtureId: string, from?: number): Promise<FibaAction[] | null> {
  const qs = from !== undefined ? `?from=${from}` : ''
  return fibaFetch<FibaAction[]>(`/api/games/${fixtureId}/actions${qs}`)
}

export async function fibaGetSetup(fixtureId: string): Promise<FibaSetup | null> {
  return fibaFetch<FibaSetup>(`/api/games/${fixtureId}/setup`)
}

// ── FIBA LiveStats v8 type shapes ────────────────────────────────────────────

export interface FibaGame {
  id: string
  homeTeamName: string
  awayTeamName: string
  scheduledStartTime: string
  status: string
}

export interface FibaGameState {
  id: string
  period: number
  periodStatus: string
  homeScore: number
  awayScore: number
  gameClock: string
  shotClock: number
  homeTimeoutsLeft: number
  awayTimeoutsLeft: number
  homeFoulsPeriod: number
  awayFoulsPeriod: number
}

export interface FibaBoxScore {
  homeTeam: FibaTeamBoxScore
  awayTeam: FibaTeamBoxScore
}

export interface FibaTeamBoxScore {
  teamId: string
  players: FibaPlayerBoxScore[]
}

export interface FibaPlayerBoxScore {
  personId: string
  shirtNumber: string
  firstName: string
  familyName: string
  starter: boolean
  onCourt: boolean
  points: number
  twoPointersMade: number
  twoPointersAttempted: number
  threePointersMade: number
  threePointersAttempted: number
  freeThrowsMade: number
  freeThrowsAttempted: number
  reboundsOffensive: number
  reboundsDefensive: number
  reboundsTotal: number
  assists: number
  steals: number
  blocks: number
  blocksReceived: number
  turnovers: number
  foulsPersonal: number
  foulsTechnical: number
  foulsUnsportsmanlike: number
  foulsDisqualifying: number
  plusMinus: number
  pointsInPaint: number
  fastBreakPoints: number
  secondChancePoints: number
  pointsFromTurnover: number
  dunks: number
  minutesPlayed: string
}

export interface FibaAction {
  actionNumber: number
  clock: string
  period: number
  teamId: string
  personId?: string
  actionType: string
  subType?: string
  qualifiers?: string[]
  scoreHome: number
  scoreAway: number
  x?: number
  y?: number
  success?: boolean
  assistPersonId?: string
}

export interface FibaSetup {
  homeTeam: { id: string; name: string; players: FibaSetupPlayer[] }
  awayTeam: { id: string; name: string; players: FibaSetupPlayer[] }
}

export interface FibaSetupPlayer {
  personId: string
  shirtNumber: string
  firstName: string
  familyName: string
  starter: boolean
  captain: boolean
}
