'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpDown, Pause, Play, RotateCcw } from 'lucide-react'

import { useLiveGame, type LiveEvent, type LivePlayerStatLine, type LiveRosterPlayer } from '@/hooks/useLiveGame'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type ActiveTab = 'boxscore' | 'log'

function formatClockMs(clockMs: number) {
  const safe = Math.max(0, Math.trunc(clockMs))
  const totalSeconds = Math.floor(safe / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function eventIcon(type: string) {
  if (type.startsWith('SCORE')) return 'SC'
  if (type.includes('FOUL')) return 'FL'
  if (type.startsWith('REBOUND')) return 'RB'
  if (type === 'ASSIST') return 'AS'
  if (type === 'STEAL') return 'ST'
  if (type === 'BLOCK') return 'BK'
  if (type === 'SUBSTITUTION') return 'SUB'
  if (type === 'TIMEOUT') return 'TO'
  if (type === 'START_PERIOD' || type === 'END_PERIOD') return 'PRD'
  if (type.startsWith('VIOLATION')) return 'VIO'
  return '.'
}

function getStatLine(playerStats: LivePlayerStatLine[], athleteId: string) {
  return (
    playerStats.find((line) => line.athleteId === athleteId) ?? {
      id: `empty-${athleteId}`,
      gameId: '',
      teamId: '',
      athleteId,
      points: 0,
      fouls: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      reboundsOffensive: 0,
      reboundsDefensive: 0,
      reboundsTotal: 0,
      twoPtMade: 0,
      twoPtAttempted: 0,
      threePtMade: 0,
      threePtAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      athlete: { id: athleteId, name: 'Atleta', jerseyNumber: null },
    }
  )
}

function TeamControlDots({
  used,
  max,
  invert,
}: {
  used: number
  max: number
  invert?: boolean
}) {
  const filledCount = invert ? Math.max(0, max - used) : used
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => (
        <span
          key={index}
          className={`h-2.5 w-2.5 rounded-full border border-black/15 ${
            index < filledCount ? 'bg-[#1B7340]' : 'bg-transparent'
          }`}
        />
      ))}
    </div>
  )
}

export function AdminLiveTablePage({ gameId }: { gameId: string }) {
  const {
    game,
    homeLineup,
    awayLineup,
    events,
    stats,
    clockMs,
    shotClockMs,
    isClockRunning,
    executeAction,
    startClock,
    stopClock,
    resetShotClock,
    isLoading,
    error,
  } = useLiveGame(gameId)

  const [activeTab, setActiveTab] = useState<ActiveTab>('boxscore')
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false)
  const [subTeamId, setSubTeamId] = useState('')
  const [subAthleteOutId, setSubAthleteOutId] = useState('')
  const [subAthleteInId, setSubAthleteInId] = useState('')

  const technicalByAthlete = useMemo(() => {
    const map = new Map<string, number>()
    events.forEach((event) => {
      const type = String(event.type || event.eventType || '')
      if (type === 'TECHNICAL_FOUL' && event.athleteId) {
        map.set(event.athleteId, (map.get(event.athleteId) || 0) + 1)
      }
    })
    return map
  }, [events])

  const homeRoster = useMemo(() => {
    return game?.gameRosters.find((entry) => entry.teamId === game.homeTeamId) ?? null
  }, [game])

  const awayRoster = useMemo(() => {
    return game?.gameRosters.find((entry) => entry.teamId === game.awayTeamId) ?? null
  }, [game])

  const substitutionRoster = useMemo(() => {
    if (!game || !subTeamId) return null
    return game.gameRosters.find((entry) => entry.teamId === subTeamId) ?? null
  }, [game, subTeamId])

  const subCandidatesIn = useMemo(() => {
    if (!substitutionRoster) return [] as LiveRosterPlayer[]
    return substitutionRoster.players.filter((entry) => !entry.isOnCourt || entry.athleteId === subAthleteInId)
  }, [subAthleteInId, substitutionRoster])

  const handleAction = (action: Parameters<typeof executeAction>[0], payload: Record<string, unknown>) => {
    if (!game) return
    void executeAction(action, {
      period: game.currentPeriod || 1,
      clockMs,
      ...payload,
    })
  }

  const openSubstitutionDialog = (teamId: string, athleteOutId: string) => {
    setSubTeamId(teamId)
    setSubAthleteOutId(athleteOutId)
    setSubAthleteInId('')
    setIsSubDialogOpen(true)
  }

  const submitSubstitution = () => {
    if (!game || !subTeamId || !subAthleteOutId || !subAthleteInId) return
    handleAction('SUBSTITUTION', {
      teamId: subTeamId,
      athleteOutId: subAthleteOutId,
      athleteInId: subAthleteInId,
    })
    setIsSubDialogOpen(false)
  }

  const handleStartClock = () => {
    startClock()
    if (game) {
      handleAction('START_PERIOD', {
        period: game.currentPeriod > 0 ? game.currentPeriod : 1,
      })
    }
  }

  const handleStopClock = () => {
    stopClock()
  }

  const handleEndPeriod = () => {
    stopClock()
    handleAction('END_PERIOD', {})
  }

  const homeBonus = (game?.homeTeamFoulsCurrentPeriod ?? 0) >= 5
  const awayBonus = (game?.awayTeamFoulsCurrentPeriod ?? 0) >= 5

  const homeTimeoutBlocked = (game?.homeTimeoutsUsed ?? 0) >= 5
  const awayTimeoutBlocked = (game?.awayTimeoutsUsed ?? 0) >= 5

  const urgentShotClock = shotClockMs < 5000

  const renderTeamPanel = (lineup: LiveRosterPlayer[], teamId: string, teamName: string) => {
    return (
      <Card className="border border-[var(--border)] bg-white">
        <CardHeader className="border-b border-[var(--border)] pb-3">
          <CardTitle className="flex items-center justify-between text-lg font-black uppercase tracking-wide">
            <span>{teamName}</span>
            {((teamId === game?.homeTeamId ? game?.homeTeamFoulsCurrentPeriod : game?.awayTeamFoulsCurrentPeriod) ?? 0) >= 5 && (
              <span className="rounded-full bg-[#F5C200] px-2 py-1 text-[10px] font-black text-black">BONUS</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {lineup.length === 0 && (
            <div className="rounded-md border border-dashed border-[var(--border)] p-3 text-sm text-[var(--gray)]">
              Nenhum jogador em quadra.
            </div>
          )}

          {lineup.map((player) => {
            const line = getStatLine(stats.players, player.athleteId)
            const technicalFouls = technicalByAthlete.get(player.athleteId) ?? 0
            const eliminated = line.fouls >= 5 || technicalFouls >= 2

            return (
              <div
                key={player.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--gray-l)] p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold text-[var(--black)]">
                    #{player.jerseyNumber ?? '--'} {player.athlete.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[var(--gray-d)]">
                      F {line.fouls}
                    </span>
                    {eliminated && (
                      <span className="rounded-full bg-[#CC1016] px-2 py-1 text-[10px] font-black text-white">ELIM.</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={eliminated}
                    onClick={() => handleAction('SCORE', { teamId, athleteId: player.athleteId, points: 2, type: '2PTS' })}
                  >
                    +2
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={eliminated}
                    onClick={() => handleAction('SCORE', { teamId, athleteId: player.athleteId, points: 3, type: '3PTS' })}
                  >
                    +3
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={eliminated}
                    onClick={() => handleAction('SCORE', { teamId, athleteId: player.athleteId, points: 1, type: 'FREE_THROW' })}
                  >
                    LL
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={eliminated}
                    onClick={() => handleAction('FOUL', { teamId, athleteId: player.athleteId, foulType: 'PERSONAL' })}
                  >
                    F
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={eliminated}
                    onClick={() => handleAction('FOUL', { teamId, athleteId: player.athleteId, foulType: 'TECHNICAL' })}
                  >
                    TF
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={eliminated}
                    onClick={() => handleAction('REBOUND', { teamId, athleteId: player.athleteId, type: 'DEFENSIVE' })}
                  >
                    R
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={eliminated}
                    onClick={() => handleAction('ASSIST', { teamId, athleteId: player.athleteId })}
                  >
                    A
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => openSubstitutionDialog(teamId, player.athleteId)}
                  >
                    <ArrowUpDown className="size-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    )
  }

  if (!gameId) {
    return <div className="p-6 text-sm text-red-700">ID do jogo invalido.</div>
  }

  if (isLoading && !game) {
    return <div className="p-6 text-sm text-[var(--gray)]">Carregando live...</div>
  }

  if (!game) {
    return <div className="p-6 text-sm text-red-700">Nao foi possivel carregar o jogo ao vivo.</div>
  }

  return (
    <div className="space-y-6 bg-[var(--bg-admin)] p-4 md:p-6">
      <Card className="border border-[var(--border)] bg-white">
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div className="text-center md:text-left">
              <div className="text-sm uppercase tracking-wide text-[var(--gray)]">{game.homeTeam.name}</div>
              <div className="text-6xl font-black text-[#1B7340]">{game.homeScore}</div>
            </div>

            <div className="text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--gray)]">Periodo {game.currentPeriod || 1}</div>
              <div className="text-5xl font-black text-[var(--black)]">{formatClockMs(clockMs)}</div>
              <div
                className={`mx-auto mt-2 inline-flex min-w-24 justify-center rounded-lg px-4 py-2 text-xl font-black ${
                  urgentShotClock ? 'animate-pulse bg-[#CC1016] text-white' : 'bg-[var(--yellow)] text-black'
                }`}
              >
                {Math.ceil(shotClockMs / 1000)}
              </div>
            </div>

            <div className="text-center md:text-right">
              <div className="text-sm uppercase tracking-wide text-[var(--gray)]">{game.awayTeam.name}</div>
              <div className="text-6xl font-black text-[#1B7340]">{game.awayScore}</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span>Faltas equipe casa</span>
                {homeBonus && <span className="rounded-full bg-[#F5C200] px-2 py-1 text-black">BONUS</span>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const active = index < (game.homeTeamFoulsCurrentPeriod ?? 0)
                    const color = (game.homeTeamFoulsCurrentPeriod ?? 0) >= 5 ? '#CC1016' : (game.homeTeamFoulsCurrentPeriod ?? 0) >= 3 ? '#FF6B00' : '#1B7340'
                    return (
                      <span
                        key={index}
                        className="h-2.5 w-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: active ? color : 'transparent' }}
                      />
                    )
                  })}
                </div>
                <TeamControlDots used={game.homeTimeoutsUsed ?? 0} max={5} invert />
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span>Faltas equipe fora</span>
                {awayBonus && <span className="rounded-full bg-[#F5C200] px-2 py-1 text-black">BONUS</span>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const active = index < (game.awayTeamFoulsCurrentPeriod ?? 0)
                    const color = (game.awayTeamFoulsCurrentPeriod ?? 0) >= 5 ? '#CC1016' : (game.awayTeamFoulsCurrentPeriod ?? 0) >= 3 ? '#FF6B00' : '#1B7340'
                    return (
                      <span
                        key={index}
                        className="h-2.5 w-2.5 rounded-full border border-black/20"
                        style={{ backgroundColor: active ? color : 'transparent' }}
                      />
                    )
                  })}
                </div>
                <TeamControlDots used={game.awayTimeoutsUsed ?? 0} max={5} invert />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[var(--border)] bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-black uppercase tracking-wide">Controles do Jogo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleStartClock}>
            <Play className="mr-1 size-4" /> Iniciar
          </Button>
          <Button variant="outline" onClick={handleStopClock}>
            <Pause className="mr-1 size-4" /> Pausar
          </Button>
          <Button variant="outline" onClick={() => resetShotClock(true)}>
            <RotateCcw className="mr-1 size-4" /> Reset 24s
          </Button>
          <Button variant="outline" onClick={() => resetShotClock(false)}>
            <RotateCcw className="mr-1 size-4" /> Reset 14s
          </Button>
          <Button variant="outline" onClick={handleEndPeriod}>
            Fim Periodo
          </Button>
          <Button
            variant="outline"
            disabled={homeTimeoutBlocked}
            onClick={() => handleAction('TIMEOUT', { teamId: game.homeTeamId })}
          >
            Timeout Home
          </Button>
          <Button
            variant="outline"
            disabled={awayTimeoutBlocked}
            onClick={() => handleAction('TIMEOUT', { teamId: game.awayTeamId })}
          >
            Timeout Away
          </Button>
          {isClockRunning && (
            <span className="inline-flex items-center rounded-full bg-[#1B7340] px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              Relogio rodando
            </span>
          )}
          {(homeTimeoutBlocked || awayTimeoutBlocked) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#CC1016] px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              <AlertTriangle className="size-3" />
              Limite de timeout atingido
            </span>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {renderTeamPanel(homeLineup, game.homeTeamId, game.homeTeam.name)}
        {renderTeamPanel(awayLineup, game.awayTeamId, game.awayTeam.name)}
      </div>

      <Card className="border border-[var(--border)] bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Button variant={activeTab === 'boxscore' ? 'default' : 'outline'} onClick={() => setActiveTab('boxscore')}>
              Boxscore
            </Button>
            <Button variant={activeTab === 'log' ? 'default' : 'outline'} onClick={() => setActiveTab('log')}>
              Log
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {activeTab === 'boxscore' && (
            <div className="space-y-6">
              {[game.homeTeamId, game.awayTeamId].map((teamId) => {
                const roster = game.gameRosters.find((entry) => entry.teamId === teamId)
                const teamName = teamId === game.homeTeamId ? game.homeTeam.name : game.awayTeam.name
                const teamLine = stats.teams.find((entry) => entry.teamId === teamId)
                const players = roster?.players ?? []
                const totals = players.reduce(
                  (acc, player) => {
                    const line = getStatLine(stats.players, player.athleteId)
                    acc.points += line.points
                    acc.rebounds += line.reboundsTotal
                    acc.assists += line.assists
                    acc.steals += line.steals
                    acc.blocks += line.blocks
                    acc.fouls += line.fouls
                    acc.fgMade += line.twoPtMade + line.threePtMade
                    acc.fgAtt += line.twoPtAttempted + line.threePtAttempted
                    acc.threeMade += line.threePtMade
                    acc.threeAtt += line.threePtAttempted
                    return acc
                  },
                  { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, fouls: 0, fgMade: 0, fgAtt: 0, threeMade: 0, threeAtt: 0 }
                )

                const teamFgPct = totals.fgAtt > 0 ? ((totals.fgMade / totals.fgAtt) * 100).toFixed(1) : '0.0'
                const team3Pct = totals.threeAtt > 0 ? ((totals.threeMade / totals.threeAtt) * 100).toFixed(1) : '0.0'

                return (
                  <div key={teamId}>
                    <h3 className="mb-2 text-base font-black uppercase tracking-wide text-[var(--black)]">{teamName}</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jogador</TableHead>
                          <TableHead>PTS</TableHead>
                          <TableHead>REB</TableHead>
                          <TableHead>AST</TableHead>
                          <TableHead>STL</TableHead>
                          <TableHead>BLK</TableHead>
                          <TableHead>F</TableHead>
                          <TableHead>FG%</TableHead>
                          <TableHead>3P%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {players.map((player) => {
                          const line = getStatLine(stats.players, player.athleteId)
                          const fgMade = line.twoPtMade + line.threePtMade
                          const fgAtt = line.twoPtAttempted + line.threePtAttempted
                          const fgPct = fgAtt > 0 ? ((fgMade / fgAtt) * 100).toFixed(1) : '0.0'
                          const threePct = line.threePtAttempted > 0 ? ((line.threePtMade / line.threePtAttempted) * 100).toFixed(1) : '0.0'
                          return (
                            <TableRow key={player.id}>
                              <TableCell>
                                #{player.jerseyNumber ?? '--'} {player.athlete.name}
                              </TableCell>
                              <TableCell>{line.points}</TableCell>
                              <TableCell>{line.reboundsTotal}</TableCell>
                              <TableCell>{line.assists}</TableCell>
                              <TableCell>{line.steals}</TableCell>
                              <TableCell>{line.blocks}</TableCell>
                              <TableCell>{line.fouls}</TableCell>
                              <TableCell>{fgPct}</TableCell>
                              <TableCell>{threePct}</TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow>
                          <TableCell className="font-black">TOTAL</TableCell>
                          <TableCell className="font-black">{teamLine?.points ?? totals.points}</TableCell>
                          <TableCell className="font-black">{teamLine?.reboundsTotal ?? totals.rebounds}</TableCell>
                          <TableCell className="font-black">{teamLine?.assists ?? totals.assists}</TableCell>
                          <TableCell className="font-black">{teamLine?.steals ?? totals.steals}</TableCell>
                          <TableCell className="font-black">{teamLine?.blocks ?? totals.blocks}</TableCell>
                          <TableCell className="font-black">{teamLine?.fouls ?? totals.fouls}</TableCell>
                          <TableCell className="font-black">{teamFgPct}</TableCell>
                          <TableCell className="font-black">{team3Pct}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'log' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  disabled={events.length === 0}
                  onClick={() => handleAction('CANCEL_LAST_EVENT', {})}
                >
                  Cancelar ultimo evento
                </Button>
              </div>
              {events.map((event) => {
                const type = String(event.type || event.eventType || '')
                const description = event.description || type
                return (
                  <div
                    key={event.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span>{eventIcon(type)}</span>
                      <div>
                        <div className="text-sm font-semibold text-[var(--black)]">{description}</div>
                        <div className="text-xs text-[var(--gray)]">{type}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-[var(--gray-d)]">
                      P{event.period} {event.clockTime || '--:--'}
                    </div>
                  </div>
                )
              })}
              {events.length === 0 && (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-sm text-[var(--gray)]">
                  Sem eventos registrados ainda.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--gray)]">
              Sai
              <select
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-white p-2 text-sm"
                value={subAthleteOutId}
                onChange={(event) => setSubAthleteOutId(event.target.value)}
              >
                <option value="">Selecione</option>
                {(substitutionRoster?.players || [])
                  .filter((entry) => entry.isOnCourt)
                  .map((entry) => (
                    <option key={entry.id} value={entry.athleteId}>
                      #{entry.jerseyNumber ?? '--'} {entry.athlete.name}
                    </option>
                  ))}
              </select>
            </label>

            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--gray)]">
              Entra
              <select
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-white p-2 text-sm"
                value={subAthleteInId}
                onChange={(event) => setSubAthleteInId(event.target.value)}
              >
                <option value="">Selecione</option>
                {subCandidatesIn
                  .filter((entry) => !entry.isOnCourt)
                  .map((entry) => (
                    <option key={entry.id} value={entry.athleteId}>
                      #{entry.jerseyNumber ?? '--'} {entry.athlete.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsSubDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitSubstitution}
              disabled={!subAthleteOutId || !subAthleteInId || subAthleteOutId === subAthleteInId}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

