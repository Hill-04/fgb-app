'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'

type AdminViewMode = 'pregame' | 'live' | 'review' | 'report' | 'audit'

const QUICK_EVENTS = [
  ['+2', 'SHOT_MADE_2', 2],
  ['+3', 'SHOT_MADE_3', 3],
  ['FT', 'FREE_THROW_MADE', 1],
  ['Reb O', 'REBOUND_OFFENSIVE'],
  ['Reb D', 'REBOUND_DEFENSIVE'],
  ['AST', 'ASSIST'],
  ['STL', 'STEAL'],
  ['BLK', 'BLOCK'],
  ['TOV', 'TURNOVER'],
  ['Falta', 'FOUL_PERSONAL'],
  ['Tempo', 'TIMEOUT_CONFIRMED'],
] as const

const CONTROL_EVENTS = [
  ['Iniciar jogo', 'GAME_START'],
  ['Iniciar período', 'PERIOD_START'],
  ['Fim período', 'PERIOD_END'],
  ['Intervalo', 'HALFTIME_START'],
  ['Voltar intervalo', 'HALFTIME_END'],
  ['Encerrar jogo', 'GAME_END'],
] as const

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'Erro na operação')
  return data
}

export function LiveGameAdminView({ gameId, mode }: { gameId: string; mode: AdminViewMode }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedAthleteId, setSelectedAthleteId] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState(1)
  const [clockTime, setClockTime] = useState('10:00')

  const endpoint = `/api/admin/games/${gameId}/${mode}`

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch(endpoint)
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Falha ao carregar módulo live')
      setData(payload)
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [endpoint])

  useEffect(() => {
    if (data?.game?.homeTeam?.id && !selectedTeamId) {
      setSelectedTeamId(data.game.homeTeam.id)
    }
    if (data?.game?.currentPeriod) {
      setSelectedPeriod(data.game.currentPeriod || 1)
    }
    if (data?.game?.clockDisplay) {
      setClockTime(data.game.clockDisplay || '10:00')
    }
  }, [data, selectedTeamId])

  const selectedPlayers = useMemo(() => {
    if (!selectedTeamId) return []
    return data?.rosters?.find((roster: any) => roster.teamId === selectedTeamId)?.players || []
  }, [data, selectedTeamId])

  const doPregameAction = async (action: string) => {
    setSubmitting(true)
    try {
      setData(await postJson(`/api/admin/games/${gameId}/pregame`, { action }))
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const doLiveAction = async (action: string, extra: Record<string, unknown> = {}) => {
    setSubmitting(true)
    try {
      setData(await postJson(`/api/admin/games/${gameId}/live`, { action, ...extra }))
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const doReviewAction = async () => {
    setSubmitting(true)
    try {
      setData(await postJson(`/api/admin/games/${gameId}/review`, { action: 'finalize-official' }))
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const updateRosterPlayer = async (rosterPlayerId: string, patch: Record<string, unknown>) => {
    setSubmitting(true)
    try {
      setData(await postJson(`/api/admin/games/${gameId}/pregame`, { action: 'update-roster-player', rosterPlayerId, patch }))
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const addOfficial = async () => {
    const name = window.prompt('Nome do oficial:')
    if (!name) return
    const officialType = window.prompt('Tipo do oficial (REFEREE, TABLE, STATS, OTHER):', 'REFEREE') || 'REFEREE'
    const role = window.prompt('Função do oficial:', 'Principal') || 'Principal'
    const officials = [...(data.officials || []), { name, officialType, role }]

    setSubmitting(true)
    try {
      setData(await postJson(`/api/admin/games/${gameId}/pregame`, { action: 'assign-officials', officials }))
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const exportReportPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('FGB · Relatório Oficial da Partida', 14, 16)
    doc.setFontSize(10)
    doc.text(`${game.championship.name} · ${game.category.name}`, 14, 24)
    doc.text(`${game.homeTeam.name} ${game.homeScore} x ${game.awayScore} ${game.awayTeam.name}`, 14, 30)
    doc.text(`Status: ${game.liveStatus}`, 14, 36)

    autoTable(doc, {
      startY: 44,
      head: [['Equipe', 'Pts', 'Ast', 'Reb', 'Stl', 'Blk']],
      body: (data.boxScore?.teams || []).map((team: any) => [
        team.teamName,
        team.points,
        team.assists,
        team.reboundsTotal,
        team.steals,
        team.blocks,
      ]),
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Atleta', 'Equipe', 'Pts', 'Reb', 'Ast', 'Faltas']],
      body: (data.boxScore?.players || []).map((player: any) => [
        player.athleteName,
        player.teamName,
        player.points,
        player.reboundsTotal,
        player.assists,
        player.fouls,
      ]),
    })

    doc.save(`relatorio-oficial-${game.homeTeam.name}-vs-${game.awayTeam.name}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="fgb-label text-[var(--gray)]">Carregando módulo live</span>
      </div>
    )
  }

  if (!data) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Falha ao carregar jogo.'}</div>
  }

  const { game } = data

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="fgb-label text-[var(--gray)]">{game.championship.name} · {game.category.name}</p>
        <h1 className="mt-2 fgb-display text-4xl leading-none text-[var(--black)]">
          {game.homeTeam.name} <span className="text-[var(--verde)]">{game.homeScore}</span> × <span className="text-[var(--verde)]">{game.awayScore}</span> {game.awayTeam.name}
        </h1>
        <p className="mt-3 text-sm text-[var(--gray)]">Status {game.liveStatus} · Período {game.currentPeriod || 0} · Relógio {game.clockDisplay || '10:00'}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/games/${gameId}/pregame`} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Pré-jogo</Link>
        <Link href={`/admin/games/${gameId}/live`} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Mesa</Link>
        <Link href={`/admin/games/${gameId}/review`} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Revisão</Link>
        <Link href={`/admin/games/${gameId}/report`} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Relatório</Link>
        <Link href={`/admin/games/${gameId}/audit`} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Auditoria</Link>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {mode === 'pregame' && (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button onClick={() => doPregameAction('sync-rosters')} disabled={submitting} className="rounded-xl bg-[var(--verde)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Sincronizar rosters</button>
              <button onClick={() => doPregameAction('lock-rosters')} disabled={submitting} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Travar rosters</button>
              <button onClick={() => doPregameAction('open-session')} disabled={submitting} className="rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Abrir sessão</button>
              <button onClick={addOfficial} disabled={submitting} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Adicionar oficial</button>
            </div>
            <div className="mt-5 space-y-4">
              {(data.rosters || []).map((roster: any) => (
                <div key={roster.id} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black text-[var(--black)]">{roster.teamName}</h2>
                      <p className="text-sm text-[var(--gray)]">Coach: {roster.coachName || 'Não definido'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">{roster.isLocked ? 'Travado' : 'Editável'}</span>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {(roster.players || []).map((player: any) => (
                      <div key={player.id} className="rounded-xl border border-white bg-white px-3 py-3 text-sm text-[var(--black)]">
                        <div className="font-semibold">{player.jerseyNumber ?? '--'} · {player.athleteName}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button onClick={() => updateRosterPlayer(player.id, { isStarter: !player.isStarter })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isStarter ? 'Titular' : 'Banco'}</button>
                          <button onClick={() => updateRosterPlayer(player.id, { isOnCourt: !player.isOnCourt })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isOnCourt ? 'Em quadra' : 'Fora'}</button>
                          <button onClick={() => updateRosterPlayer(player.id, { isAvailable: !player.isAvailable })} className="rounded-full bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--black)]">{player.isAvailable ? 'Disponível' : 'Indisponível'}</button>
                        </div>
                      </div>
                    ))}
                    {(roster.players || []).length === 0 && (
                      <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50 px-3 py-3 text-sm text-orange-700">Sem atletas sincronizados.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Checklist</h2>
            <div className="mt-5 space-y-3 text-sm text-[var(--black)]">
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Rosters: {(data.rosters || []).length >= 2 ? 'OK' : 'Pendente'}</div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Atletas: {(data.rosters || []).every((roster: any) => roster.players.length > 0) ? 'OK' : 'Pendente'}</div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Sessão: {data.session ? 'Aberta' : 'Não iniciada'}</div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">Oficiais: {(data.referees?.length || 0) + (data.officials?.length || 0) > 0 ? 'Definidos' : 'Pendente'}</div>
            </div>
            <div className="mt-5 space-y-3">
              {(data.officials || []).map((official: any) => (
                <div key={official.id || `${official.name}-${official.role}`} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
                  {official.name} · {official.officialType} · {official.role}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'live' && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-4">
                <select value={selectedTeamId} onChange={(event) => { setSelectedTeamId(event.target.value); setSelectedAthleteId('') }} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none">
                  <option value="">Equipe</option>
                  <option value={game.homeTeam.id}>{game.homeTeam.name}</option>
                  <option value={game.awayTeam.id}>{game.awayTeam.name}</option>
                </select>
                <select value={selectedAthleteId} onChange={(event) => setSelectedAthleteId(event.target.value)} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none">
                  <option value="">Atleta</option>
                  {selectedPlayers.map((player: any) => (
                    <option key={player.id} value={player.athleteId}>{player.jerseyNumber ?? '--'} · {player.athleteName}</option>
                  ))}
                </select>
                <input value={clockTime} onChange={(event) => setClockTime(event.target.value)} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none" />
                <input type="number" min={1} value={selectedPeriod} onChange={(event) => setSelectedPeriod(Number(event.target.value) || 1)} className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none" />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {QUICK_EVENTS.map(([label, eventType, pointsDelta]) => (
                  <button key={label} onClick={() => doLiveAction('event', { eventType, pointsDelta, teamId: selectedTeamId || null, athleteId: selectedAthleteId || null, period: selectedPeriod, clockTime })} disabled={submitting} className="rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">
                    {label}
                  </button>
                ))}
                <button onClick={() => doLiveAction('event', { eventType: 'SUBSTITUTION_IN', teamId: selectedTeamId || null, athleteId: selectedAthleteId || null, period: selectedPeriod, clockTime })} disabled={submitting} className="rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">
                  Entrar
                </button>
                <button onClick={() => doLiveAction('event', { eventType: 'SUBSTITUTION_OUT', teamId: selectedTeamId || null, athleteId: selectedAthleteId || null, period: selectedPeriod, clockTime })} disabled={submitting} className="rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">
                  Sair
                </button>
                {CONTROL_EVENTS.map(([label, eventType]) => (
                  <button key={label} onClick={() => doLiveAction('event', { eventType, pointsDelta: selectedPeriod, teamId: selectedTeamId || null, athleteId: selectedAthleteId || null, period: selectedPeriod, clockTime })} disabled={submitting} className="rounded-xl bg-[var(--black)] px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white">
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Últimos eventos</h2>
                <button onClick={async () => {
                  const last = [...(data.events || [])].reverse().find((event: any) => !event.isReverted)
                  if (!last) return
                  await doLiveAction('revert-event', { eventId: last.id, reason: 'Desfazer rápido' })
                }} className="rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Desfazer último</button>
              </div>
              <div className="mt-5 space-y-3">
                {[...(data.events || [])].reverse().slice(0, 15).map((event: any) => (
                  <div key={event.id} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--black)]">{event.description}</p>
                      <span className="fgb-label text-[var(--gray)]">P{event.period} · {event.clockTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Líderes</h2>
              <div className="mt-5 space-y-3">
                {(data.boxScore?.players || []).slice(0, 10).map((player: any) => (
                  <div key={player.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--black)]">{player.athleteName}</p>
                      <p className="text-xs text-[var(--gray)]">{player.teamName}</p>
                    </div>
                    <div className="text-right text-sm text-[var(--black)]">
                      <p><strong>{player.points}</strong> pts</p>
                      <p>{player.reboundsTotal} reb · {player.assists} ast</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={() => doLiveAction('publish')} className="rounded-xl bg-[var(--verde)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Publicar no site</button>
                <Link href={`/games/${gameId}/live`} className="rounded-xl border border-[var(--border)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Ver público</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'review' && (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Checklist final</h2>
            <div className="mt-5 space-y-3">
              {(data.review?.issues || []).map((issue: string) => (
                <div key={issue} className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{issue}</div>
              ))}
              {(data.review?.warnings || []).map((warning: string) => (
                <div key={warning} className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">{warning}</div>
              ))}
              {(data.review?.issues || []).length === 0 && (data.review?.warnings || []).length === 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Partida pronta para fechamento oficial.</div>
              )}
            </div>
            <button onClick={doReviewAction} disabled={submitting || !data.review?.readyToFinalize} className="mt-5 rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">Fechar oficialmente</button>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Parciais</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(data.boxScore?.periods || []).map((period: any) => (
                <div key={period.id} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
                  Período {period.period}: {period.homePoints} × {period.awayPoints}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'report' && (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Relatório oficial</h2>
              <button onClick={exportReportPdf} className="rounded-xl bg-[var(--black)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white">Baixar PDF</button>
            </div>
            <div className="mt-5 space-y-3">
              {(data.boxScore?.teams || []).map((team: any) => (
                <div key={team.id} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
                  <strong>{team.teamName}</strong>: {team.points} pts · {team.assists} ast · {team.reboundsTotal} reb · {team.steals} stl
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Box score individual</h2>
            <div className="mt-5 space-y-3">
              {(data.boxScore?.players || []).map((player: any) => (
                <div key={player.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-[var(--border)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--black)]">{player.athleteName}</p>
                    <p className="text-xs text-[var(--gray)]">{player.teamName}</p>
                  </div>
                  <div className="text-right text-sm text-[var(--black)]">
                    <p><strong>{player.points}</strong> pts</p>
                    <p>{player.reboundsTotal} reb · {player.assists} ast</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'audit' && (
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Auditoria</h2>
          <div className="mt-5 space-y-3">
            {(data.auditLogs || []).map((log: any) => (
              <div key={log.id} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--black)]">{log.description}</p>
                  <span className="text-xs text-[var(--gray)]">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--gray)]">{log.actionType} · {log.targetEntity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
