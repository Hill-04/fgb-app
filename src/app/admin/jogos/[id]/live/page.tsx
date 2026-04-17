'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, use } from 'react'
import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/Badge'
import { Button } from '@/components/ui/button'

const QUICK_ACTIONS = [
  { label: '+1 ponto', eventType: 'POINT_1', style: 'bg-emerald-600 text-white' },
  { label: '+2 pontos', eventType: 'POINT_2', style: 'bg-emerald-700 text-white' },
  { label: '+3 pontos', eventType: 'POINT_3', style: 'bg-emerald-800 text-white' },
  { label: 'Reb O', eventType: 'REBOUND_OFF', style: 'bg-white text-[var(--black)] border border-[var(--border)]' },
  { label: 'Reb D', eventType: 'REBOUND_DEF', style: 'bg-white text-[var(--black)] border border-[var(--border)]' },
  { label: 'Assist', eventType: 'ASSIST', style: 'bg-white text-[var(--black)] border border-[var(--border)]' },
  { label: 'Roubo', eventType: 'STEAL', style: 'bg-white text-[var(--black)] border border-[var(--border)]' },
  { label: 'Toco', eventType: 'BLOCK', style: 'bg-white text-[var(--black)] border border-[var(--border)]' },
  { label: 'Turnover', eventType: 'TURNOVER', style: 'bg-white text-[var(--black)] border border-[var(--border)]' },
  { label: 'Falta', eventType: 'FOUL', style: 'bg-white text-[var(--black)] border border-[var(--border)]' },
]

function sortLeaders(players: any[], key: 'points' | 'assists' | 'reboundsTotal') {
  return [...players]
    .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0) || String(a.athleteName).localeCompare(String(b.athleteName)))
    .slice(0, 3)
}

export default function AdminJogoLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedAthleteId, setSelectedAthleteId] = useState('')
  const [period, setPeriod] = useState(1)
  const [clockTime, setClockTime] = useState('10:00')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/jogos/${id}/live`)
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error || 'Falha ao carregar live scout')
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
  }, [id])

  useEffect(() => {
    if (!data?.game) return
    setSelectedTeamId((current) => current || data.game.homeTeam.id)
    setPeriod(data.game.currentPeriod || 1)
    setClockTime(data.game.clockDisplay || '10:00')
  }, [data])

  const selectedRoster = useMemo(() => {
    if (!selectedTeamId) return null
    return (data?.rosters || []).find((roster: any) => roster.teamId === selectedTeamId) || null
  }, [data, selectedTeamId])

  const canOperate = Boolean(data?.liveSummary?.rostersLocked) && data?.game?.status !== 'FINISHED'

  const postJson = async (url: string, body: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.error || 'OperaÃ§Ã£o falhou')
    return payload
  }

  const handleOpenSession = async () => {
    setSubmitting(true)
    try {
      const payload = await postJson(`/api/admin/jogos/${id}/live`, { action: 'OPEN_SESSION' })
      setData(payload)
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickAction = async (eventType: string) => {
    if (!selectedTeamId || !selectedAthleteId) {
      setError('Selecione time e atleta para registrar a aÃ§Ã£o.')
      return
    }

    setSubmitting(true)
    try {
      const payload = await postJson(`/api/admin/jogos/${id}/events`, {
        event_type: eventType,
        team_id: selectedTeamId,
        athlete_id: selectedAthleteId,
        period,
        clock_time: clockTime,
      })
      setData(payload)
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUndoLast = async () => {
    setSubmitting(true)
    try {
      const payload = await postJson(`/api/admin/jogos/${id}/events`, { action: 'UNDO_LAST' })
      setData(payload)
      setError('')
    } catch (currentError: any) {
      setError(currentError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="fgb-label text-[var(--gray)]">Carregando mesa digital...</span>
      </div>
    )
  }

  if (!data?.game) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Jogo nÃ£o encontrado.'}</div>
  }

  const pointLeaders = sortLeaders(data.boxScore?.players || [], 'points')
  const assistLeaders = sortLeaders(data.boxScore?.players || [], 'assists')
  const reboundLeaders = sortLeaders(data.boxScore?.players || [], 'reboundsTotal')

  return (
    <div className="space-y-6 max-w-[1320px] mx-auto pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/admin/jogos/${id}`}>
          <Button variant="ghost" className="text-[var(--gray)] hover:text-[var(--black)]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao detalhe
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-10 px-4 border-[var(--border)]"
            onClick={handleOpenSession}
            disabled={submitting}
          >
            Abrir SessÃ£o
          </Button>
          <Button
            variant="outline"
            className="h-10 px-4 border-[var(--border)]"
            onClick={handleUndoLast}
            disabled={submitting || !canOperate}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Desfazer Ãºltimo
          </Button>
        </div>
      </div>

      <div className="fgb-card p-8 border-t-8 border-t-[var(--verde)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="fgb-label text-[var(--gray)] text-[10px] uppercase tracking-widest">
              {data.game.championship.name} · {data.game.category.name}
            </p>
            <h1 className="fgb-display text-4xl text-[var(--black)] mt-2">
              {data.game.homeTeam.name} {data.game.homeScore} x {data.game.awayScore} {data.game.awayTeam.name}
            </h1>
          </div>
          <div className="flex flex-col gap-2 items-start lg:items-end">
            <Badge className={data.liveSummary?.rostersLocked ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}>
              {data.liveSummary?.rostersLocked ? 'Roster travado para live' : 'Roster nÃ£o travado'}
            </Badge>
            <Badge className="bg-white border-[var(--border)] text-[var(--gray)]">{data.events.length} eventos</Badge>
            <Badge variant={data.game.status === 'FINISHED' ? 'success' : 'orange'}>
              {data.game.status} · {data.game.liveStatus}
            </Badge>
          </div>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="fgb-card p-6">
            <h2 className="fgb-display text-2xl text-[var(--black)]">SeleÃ§Ã£o de Time e Atleta</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(data.rosters || []).map((roster: any) => (
                <div key={roster.id} className="rounded-2xl border border-[var(--border)] p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black text-[var(--black)] uppercase tracking-wide">{roster.teamName}</h3>
                    <Badge className={roster.isLocked ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                      {roster.isLocked ? 'Travado' : 'Aberto'}
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
                    {(roster.players || []).map((player: any) => {
                      const selected = selectedAthleteId === player.athleteId
                      const disabled = !player.isAvailable
                      return (
                        <button
                          key={player.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            setSelectedTeamId(roster.teamId)
                            setSelectedAthleteId(player.athleteId)
                          }}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                            selected
                              ? 'border-[var(--verde)] bg-emerald-50 text-[var(--black)]'
                              : 'border-[var(--border)] bg-white text-[var(--black)] hover:bg-[var(--gray-l)]'
                          } ${disabled ? 'opacity-45 cursor-not-allowed' : ''}`}
                        >
                          <span className="font-semibold">{player.jerseyNumber ?? '--'} · {player.athleteName}</span>
                          <span className="ml-2 text-[10px] font-bold uppercase text-[var(--gray)]">
                            {disabled ? 'DNP' : 'ElegÃ­vel'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={clockTime}
                onChange={(event) => setClockTime(event.target.value)}
                className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none"
                placeholder="RelÃ³gio (ex.: 07:33)"
              />
              <input
                type="number"
                min={1}
                value={period}
                onChange={(event) => setPeriod(Number(event.target.value) || 1)}
                className="h-11 rounded-xl border border-[var(--border)] px-4 text-sm outline-none"
                placeholder="PerÃ­odo"
              />
            </div>
          </div>

          <div className="fgb-card p-6">
            <h2 className="fgb-display text-2xl text-[var(--black)]">AÃ§Ãµes RÃ¡pidas</h2>
            <p className="mt-1 text-xs text-[var(--gray)]">
              Atleta selecionado: {selectedRoster?.teamName || '-'} ·{' '}
              {(selectedRoster?.players || []).find((player: any) => player.athleteId === selectedAthleteId)?.athleteName || 'Nenhum'}
            </p>
            <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.eventType}
                  type="button"
                  disabled={submitting || !canOperate}
                  onClick={() => handleQuickAction(action.eventType)}
                  className={`rounded-xl px-4 py-4 text-[11px] font-black uppercase tracking-widest disabled:opacity-60 ${action.style}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="fgb-card p-6">
            <h2 className="fgb-display text-2xl text-[var(--black)]">Log CronolÃ³gico</h2>
            <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
              {[...(data.events || [])]
                .slice()
                .reverse()
                .map((event: any) => (
                  <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--black)]">
                        #{event.sequenceNumber} · {event.teamName || 'Equipe'} · {event.athleteName || 'Sem atleta'}
                      </p>
                      <span className="text-xs font-bold text-[var(--gray)] uppercase">
                        P{event.period} · {event.clockTime}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--black)]">{event.description}</p>
                    <p className="mt-1 text-xs text-[var(--gray)]">
                      Impacto: {event.pointsDelta ? `${event.pointsDelta > 0 ? '+' : ''}${event.pointsDelta}` : 'sem alteraÃ§Ã£o de placar'}
                    </p>
                  </div>
                ))}
              {(data.events || []).length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--gray)]">
                  Nenhum evento lanÃ§ado ainda.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="fgb-card p-6">
            <h2 className="fgb-display text-2xl text-[var(--black)]">Resumo ao Vivo</h2>
            <div className="mt-4 rounded-2xl border border-[var(--border)] p-4 bg-[var(--gray-l)]">
              <p className="text-xs text-[var(--gray)] uppercase tracking-widest font-bold">Placar atual</p>
              <p className="text-4xl font-black text-[var(--black)] mt-2">
                {data.game.homeScore} x {data.game.awayScore}
              </p>
            </div>
          </div>

          <div className="fgb-card p-6">
            <h2 className="fgb-display text-2xl text-[var(--black)]">LÃ­deres de Pontos</h2>
            <div className="mt-4 space-y-3">
              {pointLeaders.map((player: any) => (
                <div key={`pts-${player.id}`} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
                  <strong>{player.athleteName}</strong> · {player.teamName} · {player.points} pts
                </div>
              ))}
            </div>
          </div>

          <div className="fgb-card p-6">
            <h2 className="fgb-display text-2xl text-[var(--black)]">LÃ­deres de AssistÃªncia</h2>
            <div className="mt-4 space-y-3">
              {assistLeaders.map((player: any) => (
                <div key={`ast-${player.id}`} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
                  <strong>{player.athleteName}</strong> · {player.teamName} · {player.assists} ast
                </div>
              ))}
            </div>
          </div>

          <div className="fgb-card p-6">
            <h2 className="fgb-display text-2xl text-[var(--black)]">LÃ­deres de Rebotes</h2>
            <div className="mt-4 space-y-3">
              {reboundLeaders.map((player: any) => (
                <div key={`reb-${player.id}`} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--black)]">
                  <strong>{player.athleteName}</strong> · {player.teamName} · {player.reboundsTotal} reb
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
