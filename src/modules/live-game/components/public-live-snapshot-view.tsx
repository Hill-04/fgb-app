'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

type PublicLeader = {
  athleteName: string
  teamName: string
  value: number
} | null

type PublicPlayerLine = {
  athleteId: string
  name: string
  jerseyNumber: number | null
  points: number
  rebounds: number
  assists: number
  fouls: number
  steals: number
  blocks: number
}

type PublicLivePayload = {
  game: {
    id: string
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED'
    isLive: boolean
    isFinished: boolean
    scheduledAt: string | null
    venue: string | null
  }
  homeTeam: {
    id: string
    name: string
    shortName: string
    logoUrl: string | null
    score: number
  }
  awayTeam: {
    id: string
    name: string
    shortName: string
    logoUrl: string | null
    score: number
  }
  leaders: {
    points: PublicLeader
    assists: PublicLeader
    rebounds: PublicLeader
    steals: PublicLeader
    blocks: PublicLeader
  }
  recentEvents: Array<{
    period: number | null
    clockTime: string | null
    description: string
    teamName: string | null
    athleteName: string | null
    pointsDelta: number
    occurredAt: string | null
  }>
  teamSummary: {
    home: {
      teamId: string
      teamName: string
      points: number
      rebounds: number
      assists: number
      fouls: number
      turnovers: number
    }
    away: {
      teamId: string
      teamName: string
      points: number
      rebounds: number
      assists: number
      fouls: number
      turnovers: number
    }
  }
  boxScore: {
    homePlayers: PublicPlayerLine[]
    awayPlayers: PublicPlayerLine[]
  }
  summary: {
    totalEvents: number
    lastEventAt: string | null
    currentPeriod: number | null
  }
}

function getPollDelay(payload: PublicLivePayload | null) {
  if (payload?.game?.isLive) return 5000
  return 12000
}

function statusLabel(payload: PublicLivePayload) {
  if (payload.game.isFinished) return 'Finalizado'
  if (payload.game.isLive) return 'Ao vivo'
  return 'Agendado'
}

function gameMessage(payload: PublicLivePayload) {
  if (payload.game.isFinished) return 'Jogo encerrado. Resultado final consolidado.'
  if (payload.game.isLive) return 'Partida em andamento com atualizacao automatica.'
  return 'Jogo ainda nao iniciado. Acompanhe os updates aqui.'
}

function renderLeaderLine(title: string, leader: PublicLeader) {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-4 bg-white">
      <p className="text-xs uppercase tracking-widest text-[var(--gray)] font-bold">{title}</p>
      <p className="text-sm font-semibold text-[var(--black)]">
        {leader ? `${leader.athleteName} (${leader.teamName}) - ${leader.value}` : 'Sem lider definido'}
      </p>
    </div>
  )
}

function BoxScoreCard({ title, players }: { title: string; players: PublicPlayerLine[] }) {
  return (
    <div className="fgb-card p-6">
      <h2 className="fgb-display text-2xl text-[var(--black)]">{title}</h2>
      {players.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--gray)]">
          Nenhum atleta com estatistica registrada.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
          <table className="min-w-[680px] w-full text-sm">
            <thead className="bg-[var(--gray-l)] text-[10px] uppercase tracking-widest text-[var(--gray)]">
              <tr>
                <th className="px-4 py-3 text-left">Atleta</th>
                <th className="px-2 py-3 text-center">Cam</th>
                <th className="px-2 py-3 text-center">Pts</th>
                <th className="px-2 py-3 text-center">Reb</th>
                <th className="px-2 py-3 text-center">Ast</th>
                <th className="px-2 py-3 text-center">Flt</th>
                <th className="px-2 py-3 text-center">Rbo</th>
                <th className="px-2 py-3 text-center">Toc</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.athleteId} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-semibold text-[var(--black)]">{player.name}</td>
                  <td className="px-2 py-3 text-center text-[var(--gray)]">{player.jerseyNumber ?? '--'}</td>
                  <td className="px-2 py-3 text-center font-black text-[var(--black)]">{player.points}</td>
                  <td className="px-2 py-3 text-center text-[var(--black)]">{player.rebounds}</td>
                  <td className="px-2 py-3 text-center text-[var(--black)]">{player.assists}</td>
                  <td className="px-2 py-3 text-center text-[var(--black)]">{player.fouls}</td>
                  <td className="px-2 py-3 text-center text-[var(--black)]">{player.steals}</td>
                  <td className="px-2 py-3 text-center text-[var(--black)]">{player.blocks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function PublicLiveSnapshotView({ gameId }: { gameId: string }) {
  const [data, setData] = useState<PublicLivePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const mountedRef = useRef(true)
  const hasLoadedRef = useRef(false)
  const lastPayloadRef = useRef<PublicLivePayload | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const loadSnapshot = useCallback(
    async (silent = true) => {
      if (inFlightRef.current || !mountedRef.current) return null
      inFlightRef.current = true

      if (!silent && !hasLoadedRef.current) {
        setLoading(true)
      }

      try {
        const response = await fetch(`/api/public/games/${gameId}/live`, { cache: 'no-store' })
        const payload = (await response.json().catch(() => ({}))) as Partial<PublicLivePayload> & { error?: string }
        if (!response.ok) throw new Error(payload.error || 'Falha ao carregar live publico')

        if (mountedRef.current) {
          const safePayload = payload as PublicLivePayload
          setData(safePayload)
          setError('')
          setUpdatedAt(new Date().toISOString())
          hasLoadedRef.current = true
          lastPayloadRef.current = safePayload
        }

        return payload as PublicLivePayload
      } catch (currentError: any) {
        if (mountedRef.current) {
          setError(currentError.message || 'Erro ao atualizar live publico')
        }
        return null
      } finally {
        inFlightRef.current = false
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [gameId]
  )

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    const scheduleNext = (delay: number) => {
      if (cancelled || !mountedRef.current) return
      clearTimer()
      timerRef.current = setTimeout(tick, delay)
    }

    const tick = async () => {
      if (cancelled || !mountedRef.current) return
      if (document.visibilityState === 'hidden') {
        return
      }
      const payload = await loadSnapshot(true)
      scheduleNext(getPollDelay(payload || lastPayloadRef.current))
    }

    const onVisibilityChange = () => {
      if (cancelled || !mountedRef.current) return
      if (document.visibilityState === 'hidden') {
        clearTimer()
        return
      }
      tick()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)

    loadSnapshot(false).then((payload) => {
      if (cancelled) return
      scheduleNext(getPollDelay(payload || lastPayloadRef.current))
    })

    return () => {
      cancelled = true
      mountedRef.current = false
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [clearTimer, loadSnapshot])

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="fgb-label text-[var(--gray)]">Carregando jogo ao vivo...</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error || 'Nao foi possivel carregar o snapshot publico.'}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-20 px-4 sm:px-6">
      <div className="fgb-card p-8 border-t-8 border-t-[var(--verde)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <p className="fgb-label text-[var(--gray)] text-[10px] uppercase tracking-widest">Live Game</p>
            <h1 className="fgb-display text-4xl text-[var(--black)] leading-tight">
              {data.homeTeam.name} {data.homeTeam.score} x {data.awayTeam.score} {data.awayTeam.name}
            </h1>
            <p className="text-sm text-[var(--gray)]">{gameMessage(data)}</p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                data.game.isLive
                  ? 'bg-rose-100 text-rose-700'
                  : data.game.isFinished
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {statusLabel(data)}
            </span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
              {data.summary.totalEvents} eventos
            </span>
            {data.summary.currentPeriod ? (
              <span className="text-xs font-semibold text-[var(--gray)]">Periodo {data.summary.currentPeriod}</span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--border)] p-4 bg-white flex items-center gap-3">
            {data.homeTeam.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.homeTeam.logoUrl} alt={data.homeTeam.name} className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--gray-l)]" />
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--gray)] font-bold">Mandante</p>
              <p className="text-base font-black text-[var(--black)]">{data.homeTeam.name}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] p-4 bg-white flex items-center gap-3">
            {data.awayTeam.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.awayTeam.logoUrl} alt={data.awayTeam.name} className="w-12 h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--gray-l)]" />
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--gray)] font-bold">Visitante</p>
              <p className="text-base font-black text-[var(--black)]">{data.awayTeam.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Leaders</h2>
          <div className="mt-4 space-y-3">
            {renderLeaderLine('Pontos', data.leaders.points)}
            {renderLeaderLine('Assistencias', data.leaders.assists)}
            {renderLeaderLine('Rebotes', data.leaders.rebounds)}
            {renderLeaderLine('Roubos', data.leaders.steals)}
            {renderLeaderLine('Tocos', data.leaders.blocks)}
          </div>
        </div>

        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Eventos recentes</h2>
          <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
            {data.recentEvents.map((event, index) => (
              <div key={`${event.occurredAt || 'event'}-${index}`} className="rounded-2xl border border-[var(--border)] p-4 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--black)]">{event.description}</p>
                  <span className="text-xs text-[var(--gray)]">
                    P{event.period ?? '-'} - {event.clockTime || '--:--'}
                  </span>
                </div>
              </div>
            ))}
            {data.recentEvents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--gray)]">
                Sem eventos publicos no momento.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Resumo do mandante</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-[var(--border)] bg-white p-3"><strong>{data.teamSummary.home.points}</strong> pts</div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3"><strong>{data.teamSummary.home.rebounds}</strong> reb</div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3"><strong>{data.teamSummary.home.assists}</strong> ast</div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3"><strong>{data.teamSummary.home.fouls}</strong> flt</div>
          </div>
        </div>

        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Resumo do visitante</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-[var(--border)] bg-white p-3"><strong>{data.teamSummary.away.points}</strong> pts</div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3"><strong>{data.teamSummary.away.rebounds}</strong> reb</div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3"><strong>{data.teamSummary.away.assists}</strong> ast</div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3"><strong>{data.teamSummary.away.fouls}</strong> flt</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <BoxScoreCard title={`Box score - ${data.homeTeam.name}`} players={data.boxScore.homePlayers} />
        <BoxScoreCard title={`Box score - ${data.awayTeam.name}`} players={data.boxScore.awayPlayers} />
      </div>

      <div className="text-xs text-[var(--gray)]">
        {updatedAt ? `Atualizado em ${new Date(updatedAt).toLocaleTimeString('pt-BR')}.` : ''}{' '}
        <Link className="underline" href={`/games/${gameId}/box-score`}>
          Ver visao complementar
        </Link>
      </div>
    </div>
  )
}
