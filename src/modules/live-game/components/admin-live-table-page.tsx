'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpDown, Pause, Play, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  useLiveGame,
  type LiveAction,
  type LivePlayerStatLine,
  type LiveRoster,
  type LiveRosterPlayer,
} from '@/hooks/useLiveGame'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type ActiveTab = 'MESA' | 'BOXSCORE' | 'LOG'

function formatClockMs(clockMs: number) {
  const safe = Math.max(0, Math.trunc(clockMs))
  const totalSeconds = Math.floor(safe / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function periodLabel(period: number, liveStatus: string) {
  if (liveStatus === 'OVERTIME') return 'PRORROGACAO'
  return `${Math.max(1, period)}º PERIODO`
}

function eventIcon(type: string) {
  if (type.startsWith('SCORE')) return 'SC'
  if (type.includes('FOUL')) return 'FL'
  if (type.startsWith('REBOUND')) return 'RB'
  if (type === 'ASSIST') return 'AS'
  if (type === 'STEAL') return 'ST'
  if (type === 'BLOCK') return 'BK'
  if (type === 'TURNOVER') return 'TO'
  if (type === 'SUBSTITUTION') return 'SUB'
  if (type === 'TIMEOUT') return 'TM'
  if (type === 'START_PERIOD' || type === 'END_PERIOD') return 'PRD'
  if (type.startsWith('VIOLATION')) return 'VIO'
  return '.'
}

function statPercent(made: number, attempted: number) {
  if (attempted <= 0) return '0%'
  return `${((made / attempted) * 100).toFixed(1)}%`
}

function getLineByAthlete(lines: LivePlayerStatLine[], athleteId: string) {
  return (
    lines.find((line) => line.athleteId === athleteId) ?? {
      id: `empty-${athleteId}`,
      gameId: '',
      teamId: '',
      athleteId,
      points: 0,
      fouls: 0,
      technicalFouls: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      reboundsOffensive: 0,
      reboundsDefensive: 0,
      reboundsTotal: 0,
      twoPtMade: 0,
      twoPtAttempted: 0,
      threePtMade: 0,
      threePtAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      athlete: {
        id: athleteId,
        name: 'Atleta',
        jerseyNumber: null,
      },
    }
  )
}

function FoulDots({ fouls }: { fouls: number }) {
  const activeColor = fouls >= 5 ? '#CC1016' : fouls >= 3 ? '#FF6B00' : '#F5C200'
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className="h-2.5 w-2.5 rounded-full border border-black/20"
          style={{ backgroundColor: index < fouls ? activeColor : 'transparent' }}
        />
      ))}
    </div>
  )
}

function TimeoutDots({ used }: { used: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className="h-2.5 w-2.5 rounded-full border border-black/20"
          style={{ backgroundColor: index < used ? '#1B7340' : 'transparent' }}
        />
      ))}
    </div>
  )
}

export function AdminLiveTablePage({ gameId }: { gameId: string }) {
  const {
    game,
    events,
    stats,
    clockMs,
    shotClockMs,
    isClockRunning,
    isLoading,
    error,
    executeAction,
    startClock,
    stopClock,
    resetShotClock,
  } = useLiveGame(gameId)

  const [activeTab, setActiveTab] = useState<ActiveTab>('MESA')
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false)
  const [subTeamId, setSubTeamId] = useState('')
  const [subAthleteOutId, setSubAthleteOutId] = useState('')
  const [subAthleteInId, setSubAthleteInId] = useState('')
  const [isOvertimeDialogOpen, setIsOvertimeDialogOpen] = useState(false)

  const homeRoster = useMemo<LiveRoster | null>(() => {
    if (!game) return null
    return game.gameRosters.find((entry) => entry.teamId === game.homeTeamId) ?? null
  }, [game])

  const awayRoster = useMemo<LiveRoster | null>(() => {
    if (!game) return null
    return game.gameRosters.find((entry) => entry.teamId === game.awayTeamId) ?? null
  }, [game])

  const substitutionRoster = useMemo<LiveRoster | null>(() => {
    if (!game || !subTeamId) return null
    return game.gameRosters.find((entry) => entry.teamId === subTeamId) ?? null
  }, [game, subTeamId])

  const subBenchPlayers = useMemo<LiveRosterPlayer[]>(() => {
    if (!substitutionRoster) return []
    return substitutionRoster.players.filter((entry) => !entry.isOnCourt && !entry.isDisqualified)
  }, [substitutionRoster])

  const [homeOnCourt, homeBench] = useMemo(() => {
    const roster = homeRoster?.players ?? []
    return [roster.filter((entry) => entry.isOnCourt), roster.filter((entry) => !entry.isOnCourt)]
  }, [homeRoster])

  const [awayOnCourt, awayBench] = useMemo(() => {
    const roster = awayRoster?.players ?? []
    return [roster.filter((entry) => entry.isOnCourt), roster.filter((entry) => !entry.isOnCourt)]
  }, [awayRoster])

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (left, right) =>
        Number(right.sequence ?? right.sequenceNumber ?? 0) - Number(left.sequence ?? left.sequenceNumber ?? 0)
    )
  }, [events])

  const lastCancelableEvent = useMemo(() => {
    return sortedEvents.find((event) => !event.isCancelled) ?? null
  }, [sortedEvents])

  const urgentShotClock = shotClockMs < 5000
  const urgentGameClock = clockMs < 60_000

  const currentPeriod = Math.max(1, game?.currentPeriod ?? 1)
  const homeTimeoutsUsed = game?.homeTimeoutsUsed ?? 0
  const awayTimeoutsUsed = game?.awayTimeoutsUsed ?? 0
  const homeFouls = game?.homeTeamFoulsCurrentPeriod ?? 0
  const awayFouls = game?.awayTeamFoulsCurrentPeriod ?? 0
  const homeTimeoutBlocked = homeTimeoutsUsed >= 5
  const awayTimeoutBlocked = awayTimeoutsUsed >= 5

  const withAction = async (action: LiveAction, payload: Record<string, unknown> = {}) => {
    if (!game) return
    await executeAction(action, {
      period: currentPeriod,
      clockMs,
      ...payload,
    })
  }

  const openSubDialog = (teamId: string, athleteOutId: string) => {
    setSubTeamId(teamId)
    setSubAthleteOutId(athleteOutId)
    setSubAthleteInId('')
    setIsSubDialogOpen(true)
  }

  const submitSubstitution = async () => {
    if (!subTeamId || !subAthleteOutId || !subAthleteInId) return
    await withAction('SUBSTITUTION', {
      teamId: subTeamId,
      playerOutId: subAthleteOutId,
      playerInId: subAthleteInId,
    })
    setIsSubDialogOpen(false)
  }

  const handleClockToggle = async () => {
    if (!game) return
    if (isClockRunning) {
      stopClock()
      return
    }
    startClock()
    await withAction('START_PERIOD', {
      period: Math.max(1, game.currentPeriod || 1),
    })
  }

  const endPeriodPayload = useMemo(() => {
    return {
      period: currentPeriod,
      homeScore: game?.homeScore ?? 0,
      awayScore: game?.awayScore ?? 0,
      isLastPeriod: currentPeriod >= 4,
      isTied: (game?.homeScore ?? 0) === (game?.awayScore ?? 0),
      clockDisplay: formatClockMs(clockMs),
    }
  }, [clockMs, currentPeriod, game?.awayScore, game?.homeScore])

  const handleEndPeriod = async () => {
    if (!game) return
    stopClock()
    if (endPeriodPayload.isLastPeriod && endPeriodPayload.isTied) {
      setIsOvertimeDialogOpen(true)
      return
    }
    await withAction('END_PERIOD', endPeriodPayload)
  }

  const renderPlayerRow = (player: LiveRosterPlayer, teamId: string) => {
    const line = getLineByAthlete(stats.players, player.athleteId)
    const eliminated = Boolean(player.isDisqualified) || line.fouls >= 5 || line.technicalFouls >= 2
    const trouble = line.fouls >= 3 && currentPeriod < 4 && !eliminated

    return (
      <div key={player.id} className="rounded-lg border border-[var(--border)] bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <div className="font-bold text-[var(--black)]">
              #{player.jerseyNumber ?? '--'} {player.athlete.name}
            </div>
            <div className="text-xs text-[var(--gray)]">
              {line.points} PTS / {line.reboundsTotal} REB / {line.assists} AST
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FoulDots fouls={line.fouls} />
            {trouble && <span className="rounded-full bg-[#F5C200] px-2 py-1 text-[10px] font-black">!</span>}
            {eliminated && (
              <span className="rounded-full bg-[#CC1016] px-2 py-1 text-[10px] font-black text-white">ELIM.</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 sm:grid-cols-9">
          <Button size="xs" variant="outline" disabled={eliminated} onClick={() => void withAction('SCORE_2', { teamId, athleteId: player.athleteId })}>+2</Button>
          <Button size="xs" variant="outline" disabled={eliminated} onClick={() => void withAction('SCORE_3', { teamId, athleteId: player.athleteId })}>+3</Button>
          <Button size="xs" variant="outline" disabled={eliminated} onClick={() => void withAction('FREE_THROW', { teamId, athleteId: player.athleteId })}>LL</Button>
          <Button size="xs" variant="outline" disabled={eliminated} onClick={() => void withAction('FREE_THROW_MISS', { teamId, athleteId: player.athleteId })}>LLx</Button>
          <Button size="xs" variant="outline" disabled={eliminated} onClick={() => void withAction('PERSONAL_FOUL', { teamId, athleteId: player.athleteId })}>F</Button>
          <Button size="xs" variant="outline" disabled={eliminated} onClick={() => void withAction('TECHNICAL_FOUL', { teamId, athleteId: player.athleteId })}>TF</Button>
          <Button size="xs" variant="outline" disabled={eliminated} onClick={() => void withAction('REBOUND_DEF', { teamId, athleteId: player.athleteId })}>R</Button>
          <Button size="xs" variant="outline" disabled={eliminated} onClick={() => void withAction('ASSIST', { teamId, athleteId: player.athleteId })}>A</Button>
          <Button size="xs" variant="outline" onClick={() => openSubDialog(teamId, player.athleteId)}>
            <ArrowUpDown className="size-3" />
          </Button>
        </div>
      </div>
    )
  }

  const renderTeamPanel = (teamName: string, teamId: string, onCourt: LiveRosterPlayer[], bench: LiveRosterPlayer[]) => (
    <Card className="border border-[var(--border)] bg-[var(--gray-l)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-black uppercase tracking-wide">
          <span>{teamName}</span>
          {(teamId === game?.homeTeamId ? homeFouls : awayFouls) >= 5 && (
            <span className="rounded-full bg-[#1B7340] px-2 py-1 text-[10px] font-black text-white">BONUS</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
          {onCourt.length > 0 ? onCourt.map((player) => renderPlayerRow(player, teamId)) : (
            <div className="rounded-md border border-dashed border-[var(--border)] bg-white p-3 text-sm text-[var(--gray)]">
              Sem jogadores em quadra.
            </div>
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-2">
          <div className="mb-2 text-xs font-black uppercase tracking-wider text-[var(--gray)]">Banco</div>
          <div className="max-h-[180px] space-y-1 overflow-y-auto pr-1">
            {bench.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-sm">
                <span>
                  #{player.jerseyNumber ?? '--'} {player.athlete.name}
                </span>
                {player.isDisqualified && (
                  <span className="rounded-full bg-[#CC1016] px-2 py-0.5 text-[10px] font-black text-white">ELIM.</span>
                )}
              </div>
            ))}
            {bench.length === 0 && (
              <div className="rounded-md border border-dashed border-[var(--border)] bg-white p-2 text-xs text-[var(--gray)]">
                Sem banco disponivel.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (!gameId) {
    return <div className="p-6 text-sm text-red-700">ID do jogo invalido.</div>
  }

  if (isLoading && !game) {
    return <div className="p-6 text-sm text-[var(--gray)]">Carregando mesa ao vivo...</div>
  }

  if (!game) {
    return <div className="p-6 text-sm text-red-700">Nao foi possivel carregar o jogo ao vivo.</div>
  }

  return (
    <div className="space-y-4 bg-[var(--bg-admin)] p-4 md:p-6">
      <div className="flex flex-wrap gap-2">
        {(['MESA', 'BOXSCORE', 'LOG'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'MESA' && (
        <>
          <Card className="sticky top-2 z-10 border border-[var(--border)] bg-[var(--black)] text-white">
            <CardContent className="space-y-4 pt-4">
              <div className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                {game.championship?.name || 'Campeonato'} {game.category?.name ? `| ${game.category.name}` : ''}
              </div>

              <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
                <div className="text-center md:text-left">
                  <div className="text-xs uppercase tracking-wide text-white/70">{game.homeTeam.name}</div>
                  <div className="text-[clamp(3rem,8vw,6rem)] leading-none font-black">{game.homeScore}</div>
                </div>

                <div className="text-center">
                  <div className="text-xs uppercase tracking-[0.2em] text-[#F5C200]">
                    {periodLabel(game.currentPeriod, game.liveStatus)}
                  </div>
                  <div className={`text-[clamp(2.2rem,6vw,4rem)] leading-none font-black ${urgentGameClock ? 'text-[#CC1016]' : 'text-white'}`}>
                    {formatClockMs(clockMs)}
                  </div>
                  <div className={`mx-auto mt-2 inline-flex min-w-24 justify-center rounded-lg border-2 px-4 py-2 text-2xl font-black ${
                    urgentShotClock ? 'animate-pulse border-[#CC1016] bg-[#CC1016] text-white' : 'border-[#F5C200] bg-[#F5C200] text-black'
                  }`}>
                    {Math.ceil(shotClockMs / 1000)}
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <div className="text-xs uppercase tracking-wide text-white/70">{game.awayTeam.name}</div>
                  <div className="text-[clamp(3rem,8vw,6rem)] leading-none font-black">{game.awayScore}</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-white/20 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase">
                    <span>Faltas Casa</span>
                    {homeFouls >= 5 && <span className="rounded-full bg-[#1B7340] px-2 py-1 text-[10px]">BONUS</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <FoulDots fouls={homeFouls} />
                    <TimeoutDots used={homeTimeoutsUsed} />
                  </div>
                </div>
                <div className="rounded-lg border border-white/20 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase">
                    <span>Faltas Fora</span>
                    {awayFouls >= 5 && <span className="rounded-full bg-[#1B7340] px-2 py-1 text-[10px]">BONUS</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <FoulDots fouls={awayFouls} />
                    <TimeoutDots used={awayTimeoutsUsed} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-[var(--border)] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-black uppercase">Controles do Jogo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void handleClockToggle()}>
                  {isClockRunning ? <Pause className="mr-1 size-4" /> : <Play className="mr-1 size-4" />}
                  {isClockRunning ? 'PAUSAR' : 'INICIAR'}
                </Button>
                <Button variant="outline" onClick={() => resetShotClock(true)}>
                  <RotateCcw className="mr-1 size-4" /> 24s
                </Button>
                <Button variant="outline" onClick={() => resetShotClock(false)}>
                  <RotateCcw className="mr-1 size-4" /> 14s
                </Button>
                <Button variant="outline" onClick={() => void handleEndPeriod()}>
                  FIM PERIODO
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  title={homeTimeoutBlocked ? 'Timeouts esgotados' : ''}
                  disabled={homeTimeoutBlocked}
                  onClick={() => {
                    stopClock()
                    void withAction('TIMEOUT', { teamSide: 'HOME' })
                  }}
                >
                  TIMEOUT HOME ({Math.max(0, 5 - homeTimeoutsUsed)})
                </Button>
                <Button
                  variant="outline"
                  title={awayTimeoutBlocked ? 'Timeouts esgotados' : ''}
                  disabled={awayTimeoutBlocked}
                  onClick={() => {
                    stopClock()
                    void withAction('TIMEOUT', { teamSide: 'AWAY' })
                  }}
                >
                  TIMEOUT AWAY ({Math.max(0, 5 - awayTimeoutsUsed)})
                </Button>
                {(homeTimeoutBlocked || awayTimeoutBlocked) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#CC1016] px-3 py-1 text-xs font-black uppercase text-white">
                    <AlertTriangle className="size-3" />
                    Limite de timeout
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {renderTeamPanel(game.homeTeam.name, game.homeTeamId, homeOnCourt, homeBench)}
            {renderTeamPanel(game.awayTeam.name, game.awayTeamId, awayOnCourt, awayBench)}
          </div>
        </>
      )}

      {activeTab === 'BOXSCORE' && (
        <Card className="border border-[var(--border)] bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase">Boxscore</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {[game.homeTeamId, game.awayTeamId].map((teamId) => {
              const roster = game.gameRosters.find((entry) => entry.teamId === teamId)
              const teamName = teamId === game.homeTeamId ? game.homeTeam.name : game.awayTeam.name
              const players = [...(roster?.players ?? [])].sort((left, right) => {
                if (left.isStarter !== right.isStarter) return Number(right.isStarter) - Number(left.isStarter)
                const leftPts = getLineByAthlete(stats.players, left.athleteId).points
                const rightPts = getLineByAthlete(stats.players, right.athleteId).points
                return rightPts - leftPts
              })

              const totals = players.reduce(
                (acc, player) => {
                  const line = getLineByAthlete(stats.players, player.athleteId)
                  acc.points += line.points
                  acc.rebounds += line.reboundsTotal
                  acc.assists += line.assists
                  acc.steals += line.steals
                  acc.blocks += line.blocks
                  acc.turnovers += line.turnovers
                  acc.fouls += line.fouls
                  acc.fgMade += line.twoPtMade + line.threePtMade
                  acc.fgAtt += line.twoPtAttempted + line.threePtAttempted
                  acc.threeMade += line.threePtMade
                  acc.threeAtt += line.threePtAttempted
                  acc.ftMade += line.freeThrowsMade
                  acc.ftAtt += line.freeThrowsAttempted
                  return acc
                },
                {
                  points: 0,
                  rebounds: 0,
                  assists: 0,
                  steals: 0,
                  blocks: 0,
                  turnovers: 0,
                  fouls: 0,
                  fgMade: 0,
                  fgAtt: 0,
                  threeMade: 0,
                  threeAtt: 0,
                  ftMade: 0,
                  ftAtt: 0,
                }
              )

              return (
                <div key={teamId}>
                  <h3 className="mb-2 text-base font-black uppercase tracking-wide">{teamName}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>PTS</TableHead>
                        <TableHead>REB</TableHead>
                        <TableHead>AST</TableHead>
                        <TableHead>STL</TableHead>
                        <TableHead>BLK</TableHead>
                        <TableHead>TOV</TableHead>
                        <TableHead>F</TableHead>
                        <TableHead>FG</TableHead>
                        <TableHead>3P</TableHead>
                        <TableHead>LL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player) => {
                        const line = getLineByAthlete(stats.players, player.athleteId)
                        const fgMade = line.twoPtMade + line.threePtMade
                        const fgAtt = line.twoPtAttempted + line.threePtAttempted
                        return (
                          <TableRow key={player.id}>
                            <TableCell>{player.jerseyNumber ?? '--'}</TableCell>
                            <TableCell>{player.athlete.name}</TableCell>
                            <TableCell>{line.points}</TableCell>
                            <TableCell>{line.reboundsTotal}</TableCell>
                            <TableCell>{line.assists}</TableCell>
                            <TableCell>{line.steals}</TableCell>
                            <TableCell>{line.blocks}</TableCell>
                            <TableCell>{line.turnovers}</TableCell>
                            <TableCell>{line.fouls}</TableCell>
                            <TableCell>{fgMade}/{fgAtt} ({statPercent(fgMade, fgAtt)})</TableCell>
                            <TableCell>{line.threePtMade}/{line.threePtAttempted} ({statPercent(line.threePtMade, line.threePtAttempted)})</TableCell>
                            <TableCell>{line.freeThrowsMade}/{line.freeThrowsAttempted} ({statPercent(line.freeThrowsMade, line.freeThrowsAttempted)})</TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow>
                        <TableCell className="font-black">-</TableCell>
                        <TableCell className="font-black">TOTAL</TableCell>
                        <TableCell className="font-black">{totals.points}</TableCell>
                        <TableCell className="font-black">{totals.rebounds}</TableCell>
                        <TableCell className="font-black">{totals.assists}</TableCell>
                        <TableCell className="font-black">{totals.steals}</TableCell>
                        <TableCell className="font-black">{totals.blocks}</TableCell>
                        <TableCell className="font-black">{totals.turnovers}</TableCell>
                        <TableCell className="font-black">{totals.fouls}</TableCell>
                        <TableCell className="font-black">{totals.fgMade}/{totals.fgAtt} ({statPercent(totals.fgMade, totals.fgAtt)})</TableCell>
                        <TableCell className="font-black">{totals.threeMade}/{totals.threeAtt} ({statPercent(totals.threeMade, totals.threeAtt)})</TableCell>
                        <TableCell className="font-black">{totals.ftMade}/{totals.ftAtt} ({statPercent(totals.ftMade, totals.ftAtt)})</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {activeTab === 'LOG' && (
        <Card className="border border-[var(--border)] bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase">Log de Eventos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedEvents.map((event) => {
              const type = String(event.type || event.eventType || '')
              const cancellable = lastCancelableEvent?.id === event.id && !event.isCancelled
              return (
                <div
                  key={event.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] p-3 ${
                    event.isCancelled ? 'bg-slate-100 opacity-60 line-through' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-[var(--gray-l)] px-2 py-1 text-xs font-black">{eventIcon(type)}</span>
                    <div>
                      <div className="text-sm font-semibold">{event.description || type}</div>
                      <div className="text-xs text-[var(--gray)]">
                        P{event.period} | {event.clockTime || '--:--'}
                      </div>
                    </div>
                  </div>
                  {cancellable ? (
                    <Button
                      size="icon-xs"
                      variant="outline"
                      onClick={() => void withAction('CANCEL_LAST_EVENT', { eventId: event.id })}
                    >
                      <X className="size-3" />
                    </Button>
                  ) : (
                    <span className="text-xs text-[var(--gray)]">-</span>
                  )}
                </div>
              )
            })}
            {sortedEvents.length === 0 && (
              <div className="rounded-md border border-dashed border-[var(--border)] p-4 text-sm text-[var(--gray)]">
                Sem eventos registrados.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Substituicao</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-[var(--border)] bg-[var(--gray-l)] p-2 text-sm">
              Sai: {subAthleteOutId || 'Nao definido'}
            </div>
            <label className="block text-xs font-black uppercase tracking-wider text-[var(--gray)]">
              Jogador que entra
              <select
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-white p-2 text-sm"
                value={subAthleteInId}
                onChange={(event) => setSubAthleteInId(event.target.value)}
              >
                <option value="">Selecione</option>
                {subBenchPlayers.map((player) => (
                  <option key={player.id} value={player.athleteId}>
                    #{player.jerseyNumber ?? '--'} {player.athlete.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void submitSubstitution()} disabled={!subAthleteInId}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOvertimeDialogOpen} onOpenChange={setIsOvertimeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jogo empatado no fim do periodo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--gray)]">Deseja registrar prorrogação agora?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOvertimeDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                setIsOvertimeDialogOpen(false)
                void withAction('END_PERIOD', endPeriodPayload).catch(() => {
                  toast.error('Nao foi possivel encerrar o periodo')
                })
              }}
            >
              Sim, prorrogação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
