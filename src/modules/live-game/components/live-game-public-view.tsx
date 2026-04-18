'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

type PublicMode = 'live' | 'box-score' | 'play-by-play'

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
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED'
    isLive: boolean
    isFinished: boolean
  }
  homeTeam: {
    name: string
    score: number
  }
  awayTeam: {
    name: string
    score: number
  }
  leaders: {
    points: PublicLeader
    assists: PublicLeader
    rebounds: PublicLeader
  }
  recentEvents: Array<{
    period: number | null
    clockTime: string | null
    description: string
    occurredAt: string | null
  }>
  teamSummary: {
    home: {
      teamName: string
      points: number
      rebounds: number
      assists: number
      fouls: number
      turnovers: number
    }
    away: {
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
}

function getDelay(data: PublicLivePayload | null) {
  if (data?.game?.isLive) return 6000
  return 12000
}

function statusLabel(data: PublicLivePayload) {
  if (data.game.isFinished) return 'Finalizado'
  if (data.game.isLive) return 'Ao vivo'
  return 'Agendado'
}

function CompactBox({
  title,
  players,
}: {
  title: string
  players: PublicPlayerLine[]
}) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
      <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">{title}</h2>
      <div className="mt-4 space-y-2">
        {players.map((player) => (
          <div key={player.athleteId} className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-[var(--black)]">
                {player.name} <span className="text-[var(--gray)]">#{player.jerseyNumber ?? '--'}</span>
              </p>
              <p className="text-[var(--black)]">
                <strong>{player.points}</strong> pts
              </p>
            </div>
            <p className="mt-1 text-xs text-[var(--gray)]">
              {player.rebounds} reb | {player.assists} ast | {player.fouls} flt | {player.steals} rbo | {player.blocks} toc
            </p>
          </div>
        ))}
        {players.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--gray)]">
            Sem estatisticas individuais.
          </div>
        )}
      </div>
    </div>
  )
}

export function LiveGamePublicView({ gameId, mode }: { gameId: string; mode: PublicMode }) {
  const [data, setData] = useState<PublicLivePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)
  const lastPayloadRef = useRef<PublicLivePayload | null>(null)

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const load = async () => {
      if (inFlightRef.current || !mountedRef.current) return null
      inFlightRef.current = true
      try {
        const response = await fetch(`/api/public/games/${gameId}/live`, { cache: 'no-store' })
        const payload = (await response.json().catch(() => ({}))) as Partial<PublicLivePayload> & { error?: string }
        if (!response.ok) throw new Error(payload.error || 'Falha ao carregar jogo ao vivo')
        const safePayload = payload as PublicLivePayload
        if (mountedRef.current) {
          setData(safePayload)
          setError('')
          lastPayloadRef.current = safePayload
        }
        return safePayload
      } catch (currentError: any) {
        if (mountedRef.current) setError(currentError.message || 'Falha ao carregar jogo ao vivo')
        return null
      } finally {
        inFlightRef.current = false
        if (mountedRef.current) setLoading(false)
      }
    }

    const schedule = (delay: number) => {
      if (cancelled || !mountedRef.current) return
      clearTimer()
      timerRef.current = setTimeout(tick, delay)
    }

    const tick = async () => {
      if (cancelled || !mountedRef.current) return
      if (document.visibilityState === 'hidden') return
      const payload = await load()
      schedule(getDelay(payload || lastPayloadRef.current))
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
    load().then((payload) => {
      if (cancelled) return
      schedule(getDelay(payload || lastPayloadRef.current))
    })

    return () => {
      cancelled = true
      mountedRef.current = false
      clearTimer()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [gameId])

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="fgb-label text-[var(--gray)]">Carregando live</span>
      </div>
    )
  }

  if (!data) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Sem dados publicados.'}</div>
  }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <h1 className="fgb-display text-4xl leading-none text-[var(--black)]">
          {data.homeTeam.name} <span className="text-[var(--verde)]">{data.homeTeam.score}</span> x <span className="text-[var(--verde)]">{data.awayTeam.score}</span> {data.awayTeam.name}
        </h1>
        <p className="mt-3 text-sm text-[var(--gray)]">Status {statusLabel(data)}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/games/${gameId}/live`} className="rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Ao vivo</Link>
          <Link href={`/games/${gameId}/box-score`} className="rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Box score</Link>
          <Link href={`/games/${gameId}/play-by-play`} className="rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Play-by-play</Link>
        </div>
      </div>

      {mode === 'live' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Eventos recentes</h2>
            <div className="mt-5 space-y-3">
              {data.recentEvents.map((event, index) => (
                <div key={`${event.occurredAt || 'event'}-${index}`} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--black)]">{event.description}</p>
                    <span className="text-xs text-[var(--gray)]">P{event.period ?? '-'} | {event.clockTime || '--:--'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Leaders</h2>
            <div className="mt-5 space-y-3 text-sm text-[var(--black)]">
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Pontos: {data.leaders.points ? `${data.leaders.points.athleteName} (${data.leaders.points.value})` : 'Sem lider'}
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Assistencias: {data.leaders.assists ? `${data.leaders.assists.athleteName} (${data.leaders.assists.value})` : 'Sem lider'}
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                Rebotes: {data.leaders.rebounds ? `${data.leaders.rebounds.athleteName} (${data.leaders.rebounds.value})` : 'Sem lider'}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'box-score' && (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Totais por equipe</h2>
            <div className="mt-5 space-y-3 text-sm text-[var(--black)]">
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <strong>{data.teamSummary.home.teamName}</strong>: {data.teamSummary.home.points} pts | {data.teamSummary.home.rebounds} reb | {data.teamSummary.home.assists} ast | {data.teamSummary.home.fouls} flt | {data.teamSummary.home.turnovers} tov
              </div>
              <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <strong>{data.teamSummary.away.teamName}</strong>: {data.teamSummary.away.points} pts | {data.teamSummary.away.rebounds} reb | {data.teamSummary.away.assists} ast | {data.teamSummary.away.fouls} flt | {data.teamSummary.away.turnovers} tov
              </div>
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <CompactBox title={`Box score - ${data.teamSummary.home.teamName}`} players={data.boxScore.homePlayers} />
            <CompactBox title={`Box score - ${data.teamSummary.away.teamName}`} players={data.boxScore.awayPlayers} />
          </div>
        </div>
      )}

      {mode === 'play-by-play' && (
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Linha do tempo</h2>
          <div className="mt-5 space-y-3">
            {data.recentEvents.map((event, index) => (
              <div key={`${event.occurredAt || 'event'}-${index}`} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--black)]">{event.description}</p>
                  <span className="text-xs text-[var(--gray)]">P{event.period ?? '-'} | {event.clockTime || '--:--'}</span>
                </div>
              </div>
            ))}
            {data.recentEvents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--gray)]">
                Sem eventos publicados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
