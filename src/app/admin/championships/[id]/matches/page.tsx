'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, Loader2, MoreVertical, Pencil, Plus, RotateCcw, Trophy, XCircle } from 'lucide-react'

type Team = { id: string; name: string }
type Category = { id: string; name: string }

type BlockedDateEntry = {
  startDate: string
  endDate: string
  reason?: string | null
}

type Registration = {
  team: Team
  categories: Category[]
  blockedDates: BlockedDateEntry[]
}

type Game = {
  id: string
  categoryId: string
  championshipId: string
  homeTeamId: string
  awayTeamId: string
  homeScore: number | null
  awayScore: number | null
  dateTime: string
  venue?: string | null
  location?: string
  status: string
  phase: number
  round: number | null
  wasRescheduled?: boolean
  rescheduleReason?: string | null
  blockedByTeamId?: string | null
  homeTeam: Team
  awayTeam: Team
  category: Category
}

type GameDetails = {
  homeTeam: {
    id: string
    name: string
    players: Array<{ id: string; name: string; number?: number | null }>
  }
  awayTeam: {
    id: string
    name: string
    players: Array<{ id: string; name: string; number?: number | null }>
  }
}

type ResultRow = {
  teamId: string
  userId: string
  points: string
}

type EditForm = {
  id?: string
  categoryId: string
  homeTeamId: string
  awayTeamId: string
  dateTime: string
  venue: string
  status: string
  homeScore: string
  awayScore: string
  reason: string
}

const emptyEditForm: EditForm = {
  categoryId: '',
  homeTeamId: '',
  awayTeamId: '',
  dateTime: '',
  venue: '',
  status: 'SCHEDULED',
  homeScore: '',
  awayScore: '',
  reason: '',
}

function formatDateLabel(dateTime: string) {
  return new Date(dateTime).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

function formatTime(dateTime: string) {
  return new Date(dateTime).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function toDateTimeLocalInput(dateTime: string) {
  const date = new Date(dateTime)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function toIsoFromInput(value: string) {
  return new Date(value).toISOString()
}

function overlapsDate(dateTime: string, blockedDate: BlockedDateEntry) {
  const value = new Date(dateTime)
  const start = new Date(blockedDate.startDate)
  const end = new Date(blockedDate.endDate)
  return value >= start && value <= end
}

function nearBlockedDate(dateTime: string, blockedDate: BlockedDateEntry) {
  const value = new Date(dateTime).getTime()
  const start = new Date(blockedDate.startDate).getTime()
  const end = new Date(blockedDate.endDate).getTime()
  const delta = 3 * 24 * 60 * 60 * 1000
  return value >= start - delta && value <= end + delta
}

export default function MatchesPage() {
  const params = useParams()
  const championshipId = params.id as string

  const [games, setGames] = useState<Game[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm)
  const [editingGameId, setEditingGameId] = useState<string | null>(null)
  const [resultGame, setResultGame] = useState<Game | null>(null)
  const [resultDetails, setResultDetails] = useState<GameDetails | null>(null)
  const [topScorers, setTopScorers] = useState<ResultRow[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [forceBlockedDate, setForceBlockedDate] = useState(false)
  const [blockedWarning, setBlockedWarning] = useState('')

  const loadPage = async () => {
    setLoading(true)
    setError('')
    try {
      const [gamesResponse, registrationsResponse] = await Promise.all([
        fetch(`/api/games?championshipId=${championshipId}`),
        fetch(`/api/championships/${championshipId}/registrations`),
      ])

      if (!gamesResponse.ok) {
        throw new Error('Não foi possível carregar os jogos.')
      }

      setGames(await gamesResponse.json())
      setRegistrations(registrationsResponse.ok ? await registrationsResponse.json() : [])
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPage()
  }, [championshipId])

  const registrationsByTeamId = useMemo(() => {
    const map = new Map<string, Registration>()
    for (const registration of registrations) {
      map.set(registration.team.id, registration)
    }
    return map
  }, [registrations])

  const categoryTeams = useMemo(() => {
    const map = new Map<string, Team[]>()

    for (const registration of registrations) {
      for (const category of registration.categories) {
        const teams = map.get(category.id) || []
        if (!teams.find((team) => team.id === registration.team.id)) {
          teams.push(registration.team)
          map.set(category.id, teams.sort((left, right) => left.name.localeCompare(right.name)))
        }
      }
    }

    return map
  }, [registrations])

  const categories = useMemo(() => Array.from(categoryTeams.keys()).map((categoryId) => {
    const registration = registrations.find((current) => current.categories.some((category) => category.id === categoryId))
    const category = registration?.categories.find((current) => current.id === categoryId)
    return { id: categoryId, name: category?.name || categoryId }
  }), [categoryTeams, registrations])

  const gamesByDate = useMemo(() => {
    return games.reduce<Record<string, Game[]>>((accumulator, game) => {
      const key = game.dateTime.slice(0, 10)
      if (!accumulator[key]) {
        accumulator[key] = []
      }
      accumulator[key].push(game)
      accumulator[key].sort((left, right) => left.dateTime.localeCompare(right.dateTime))
      return accumulator
    }, {})
  }, [games])

  const getBlockedTooltip = (game: Game) => {
    const alerts = [game.homeTeamId, game.awayTeamId]
      .map((teamId) => {
        const registration = registrationsByTeamId.get(teamId)
        if (!registration) {
          return null
        }

        const blocked = registration.blockedDates.find(
          (blockedDate) => overlapsDate(game.dateTime, blockedDate) || nearBlockedDate(game.dateTime, blockedDate)
        )

        if (!blocked) {
          return null
        }

        return `Equipe ${registration.team.name} tem restrição${blocked.reason ? `: ${blocked.reason}` : ' de data'}`
      })
      .filter(Boolean)

    return alerts.join(' · ')
  }

  const openCreateModal = (date?: string) => {
    const categoryId = categories[0]?.id || ''
    const teamList = categoryTeams.get(categoryId) || []
    setEditingGameId(null)
    setEditForm({
      ...emptyEditForm,
      categoryId,
      homeTeamId: teamList[0]?.id || '',
      awayTeamId: teamList[1]?.id || '',
      dateTime: date ? `${date}T14:00` : '',
      venue: 'A definir',
    })
    setBlockedWarning('')
    setForceBlockedDate(false)
    setShowEditModal(true)
  }

  const openEditModal = (game: Game) => {
    setEditingGameId(game.id)
    setEditForm({
      id: game.id,
      categoryId: game.categoryId,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      dateTime: toDateTimeLocalInput(game.dateTime),
      venue: game.venue || game.location || '',
      status: game.status,
      homeScore: game.homeScore?.toString() || '',
      awayScore: game.awayScore?.toString() || '',
      reason: game.rescheduleReason || '',
    })
    setBlockedWarning('')
    setForceBlockedDate(false)
    setShowEditModal(true)
  }

  const openResultModal = async (game: Game) => {
    setResultGame(game)
    setTopScorers([])
    setShowResultModal(true)
    const response = await fetch(`/api/games/${game.id}/details`)
    if (response.ok) {
      const details = await response.json()
      setResultDetails(details)
    } else {
      setResultDetails(null)
    }
  }

  const handleEditCategoryChange = (categoryId: string) => {
    const teamList = categoryTeams.get(categoryId) || []
    setEditForm((current) => ({
      ...current,
      categoryId,
      homeTeamId: teamList[0]?.id || '',
      awayTeamId: teamList[1]?.id || '',
    }))
  }

  const submitEdit = async () => {
    setSubmitting(true)
    setBlockedWarning('')

    const payload = {
      categoryId: editForm.categoryId,
      homeTeamId: editForm.homeTeamId,
      awayTeamId: editForm.awayTeamId,
      dateTime: editForm.dateTime ? toIsoFromInput(editForm.dateTime) : undefined,
      venue: editForm.venue,
      status: editForm.status,
      homeScore: editForm.homeScore === '' ? undefined : Number(editForm.homeScore),
      awayScore: editForm.awayScore === '' ? undefined : Number(editForm.awayScore),
      rescheduleReason: editForm.reason,
      wasRescheduled: Boolean(editForm.reason),
      forceBlockedDate,
      phase: 1,
      round: 1,
    }

    const response = await fetch(editingGameId ? `/api/games/${editingGameId}` : '/api/games', {
      method: editingGameId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))
    if (response.status === 409) {
      setBlockedWarning(data.message || 'A data está bloqueada para uma das equipes.')
      setSubmitting(false)
      return
    }

    if (!response.ok) {
      setError(data.error || 'Não foi possível salvar o jogo.')
      setSubmitting(false)
      return
    }

    setShowEditModal(false)
    setSubmitting(false)
    setForceBlockedDate(false)
    await loadPage()
  }

  const submitResult = async () => {
    if (!resultGame) {
      return
    }

    setSubmitting(true)

    const playerStats = topScorers
      .filter((row) => row.teamId && row.userId && row.points)
      .map((row) => ({
        teamId: row.teamId,
        userId: row.userId,
        points: Number(row.points),
      }))

    const response = await fetch(`/api/games/${resultGame.id}/score`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeScore: Number(editForm.homeScore),
        awayScore: Number(editForm.awayScore),
        status: 'FINISHED',
        playerStats,
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setError(data.error || 'Não foi possível registrar o resultado.')
      setSubmitting(false)
      return
    }

    setShowResultModal(false)
    setSubmitting(false)
    await loadPage()
  }

  const cancelGame = async (game: Game) => {
    const reason = window.prompt('Informe o motivo do cancelamento:')
    if (reason === null) {
      return
    }

    const response = await fetch(`/api/games/${game.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })

    if (response.ok) {
      await loadPage()
      return
    }

    setError('Não foi possível cancelar o jogo.')
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gray)]">Carregando jogos</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="fgb-display text-3xl text-[var(--black)] leading-none">Jogos</h2>
          <p className="fgb-label mt-1 text-[var(--gray)]" style={{ fontSize: 10, letterSpacing: 2 }}>
            {games.length} jogo(s) cadastrados
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--amarelo)] px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] shadow-sm transition-all hover:bg-[#E66000]"
        >
          <Plus className="h-4 w-4" />
          Novo jogo
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600">
          {error}
        </div>
      )}

      {games.length === 0 ? (
        <div className="fgb-card bg-white p-12 text-center">
          <p className="text-sm text-[var(--gray)]">Nenhum jogo cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(gamesByDate)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([date, dayGames]) => (
              <div key={date} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                    <span className="text-[var(--black)]">{formatDateLabel(dayGames[0].dateTime)}</span>
                    <span>Fase {Math.min(...dayGames.map((game) => game.phase || 1))}</span>
                    <span>{dayGames.length} jogo(s)</span>
                  </div>
                  <button
                    onClick={() => openCreateModal(date)}
                    className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-3">
                  {dayGames.map((game) => {
                    const blockedTooltip = getBlockedTooltip(game)
                    return (
                      <div key={game.id} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-white px-5 py-4 shadow-sm md:grid-cols-[80px_110px_1fr_130px_120px_64px] md:items-center">
                        <div className="text-sm font-black text-[var(--black)]">{formatTime(game.dateTime)}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">{game.category.name}</div>
                        <div className="flex items-center gap-3 text-sm font-black text-[var(--black)]">
                          <span>{game.homeTeam.name}</span>
                          <span className="rounded-xl bg-[var(--gray-l)] px-3 py-1 tabular-nums">
                            {game.homeScore ?? '-'} × {game.awayScore ?? '-'}
                          </span>
                          <span>{game.awayTeam.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                            {game.status}
                          </span>
                          {blockedTooltip && (
                            <span title={blockedTooltip} className="text-red-500">
                              <AlertTriangle className="h-4 w-4" />
                            </span>
                          )}
                          {game.wasRescheduled && (
                            <span title={game.rescheduleReason || 'Jogo reagendado'} className="rounded-full bg-yellow-100 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-yellow-700">
                              Reagendado
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--gray)]">{game.venue || game.location || 'A definir'}</div>
                        <details className="relative">
                          <summary className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] text-[var(--gray)] list-none">
                            <MoreVertical className="h-4 w-4" />
                          </summary>
                          <div className="absolute right-0 z-20 mt-2 flex w-56 flex-col rounded-2xl border border-[var(--border)] bg-white p-2 shadow-xl">
                            <button onClick={() => openEditModal(game)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--black)] hover:bg-[var(--gray-l)]"><Pencil className="h-4 w-4" />Editar data/hora/local</button>
                            <button onClick={() => openEditModal(game)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--black)] hover:bg-[var(--gray-l)]"><RotateCcw className="h-4 w-4" />Trocar confronto</button>
                            <button onClick={() => { setEditForm((current) => ({ ...current, homeScore: game.homeScore?.toString() || '', awayScore: game.awayScore?.toString() || '' })); openResultModal(game) }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--black)] hover:bg-[var(--gray-l)]"><Trophy className="h-4 w-4" />Registrar resultado</button>
                            <button onClick={() => openEditModal(game)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--black)] hover:bg-[var(--gray-l)]"><RotateCcw className="h-4 w-4" />Remarcar jogo</button>
                            <button onClick={() => cancelGame(game)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"><XCircle className="h-4 w-4" />Cancelar jogo</button>
                          </div>
                        </details>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-white shadow-2xl">
            <div className="border-b border-[var(--border)] bg-[var(--gray-l)] px-8 py-6">
              <h3 className="fgb-display text-2xl text-[var(--black)] leading-none">
                {editingGameId ? 'Editar Jogo' : 'Criar Jogo Manual'}
              </h3>
            </div>
            <div className="space-y-5 px-8 py-8">
              <div className="grid gap-4 md:grid-cols-2">
                <select value={editForm.categoryId} onChange={(event) => handleEditCategoryChange(event.target.value)} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <input type="datetime-local" value={editForm.dateTime} onChange={(event) => setEditForm((current) => ({ ...current, dateTime: event.target.value }))} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <select value={editForm.homeTeamId} onChange={(event) => setEditForm((current) => ({ ...current, homeTeamId: event.target.value }))} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none">
                  {(categoryTeams.get(editForm.categoryId) || []).map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <select value={editForm.awayTeamId} onChange={(event) => setEditForm((current) => ({ ...current, awayTeamId: event.target.value }))} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none">
                  {(categoryTeams.get(editForm.categoryId) || []).map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input value={editForm.venue} onChange={(event) => setEditForm((current) => ({ ...current, venue: event.target.value }))} placeholder="Ginásio / local" className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none" />
                <select value={editForm.status} onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none">
                  {['SCHEDULED', 'FINISHED', 'CANCELLED', 'POSTPONED'].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <textarea value={editForm.reason} onChange={(event) => setEditForm((current) => ({ ...current, reason: event.target.value }))} rows={4} placeholder="Motivo da alteração" className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none" />

              {blockedWarning && (
                <div className="space-y-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-700">
                  <p>{blockedWarning}</p>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={forceBlockedDate} onChange={(event) => setForceBlockedDate(event.target.checked)} />
                    Forçar mesmo assim
                  </label>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--gray-l)] px-8 py-5">
              <button onClick={() => setShowEditModal(false)} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                Cancelar
              </button>
              <button onClick={submitEdit} disabled={submitting} className="rounded-xl bg-[var(--black)] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60">
                {submitting ? 'Salvando...' : editingGameId ? 'Salvar jogo' : 'Criar jogo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && resultGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-white shadow-2xl">
            <div className="border-b border-[var(--border)] bg-[var(--gray-l)] px-8 py-6">
              <h3 className="fgb-display text-2xl text-[var(--black)] leading-none">Registrar Resultado</h3>
            </div>
            <div className="space-y-5 px-8 py-8">
              <div className="grid gap-4 md:grid-cols-2">
                <input value={editForm.homeScore} onChange={(event) => setEditForm((current) => ({ ...current, homeScore: event.target.value }))} placeholder={`Placar ${resultGame.homeTeam.name}`} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none" />
                <input value={editForm.awayScore} onChange={(event) => setEditForm((current) => ({ ...current, awayScore: event.target.value }))} placeholder={`Placar ${resultGame.awayTeam.name}`} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none" />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gray)]">Cestinhas</p>
                {[0, 1, 2].map((index) => (
                  <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
                    <select
                      value={topScorers[index]?.teamId || ''}
                      onChange={(event) => {
                        const teamId = event.target.value
                        setTopScorers((current) => {
                          const next = [...current]
                          next[index] = { teamId, userId: '', points: next[index]?.points || '' }
                          return next
                        })
                      }}
                      className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none"
                    >
                      <option value="">Equipe</option>
                      {[resultDetails?.homeTeam, resultDetails?.awayTeam].filter(Boolean).map((team) => (
                        <option key={team!.id} value={team!.id}>{team!.name}</option>
                      ))}
                    </select>
                    <select
                      value={topScorers[index]?.userId || ''}
                      onChange={(event) =>
                        setTopScorers((current) => {
                          const next = [...current]
                          next[index] = {
                            teamId: next[index]?.teamId || '',
                            userId: event.target.value,
                            points: next[index]?.points || '',
                          }
                          return next
                        })
                      }
                      className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none"
                    >
                      <option value="">Jogador</option>
                      {(topScorers[index]?.teamId === resultDetails?.homeTeam.id
                        ? resultDetails?.homeTeam.players
                        : topScorers[index]?.teamId === resultDetails?.awayTeam.id
                          ? resultDetails?.awayTeam.players
                          : []
                      ).map((player) => (
                        <option key={player.id} value={player.id}>{player.name}</option>
                      ))}
                    </select>
                    <input
                      value={topScorers[index]?.points || ''}
                      onChange={(event) =>
                        setTopScorers((current) => {
                          const next = [...current]
                          next[index] = {
                            teamId: next[index]?.teamId || '',
                            userId: next[index]?.userId || '',
                            points: event.target.value,
                          }
                          return next
                        })
                      }
                      placeholder="Pontos"
                      className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--gray-l)] px-8 py-5">
              <button onClick={() => setShowResultModal(false)} className="rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                Cancelar
              </button>
              <button onClick={submitResult} disabled={submitting} className="rounded-xl bg-[var(--black)] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-60">
                {submitting ? 'Salvando...' : 'Confirmar resultado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
