'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

function getPollDelay(payload: any) {
  if (payload?.game?.isLive) return 5000
  return 12000
}

function statusLabel(payload: any) {
  if (payload?.game?.isFinished) return 'Finalizado'
  if (payload?.game?.isLive) return 'Ao vivo'
  return 'Agendado'
}

function gameMessage(payload: any) {
  if (payload?.game?.isFinished) return 'Jogo encerrado. Resultado final consolidado.'
  if (payload?.game?.isLive) return 'Partida em andamento com atualizacao automatica.'
  return 'Jogo ainda nao iniciado. Acompanhe os updates aqui.'
}

export function PublicLiveSnapshotView({ gameId }: { gameId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const mountedRef = useRef(true)
  const hasLoadedRef = useRef(false)
  const lastPayloadRef = useRef<any>(null)

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
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || 'Falha ao carregar live publico')

        if (mountedRef.current) {
          setData(payload)
          setError('')
          setUpdatedAt(new Date().toISOString())
          hasLoadedRef.current = true
          lastPayloadRef.current = payload
        }

        return payload
      } catch (currentError: any) {
        if (mountedRef.current) {
          setError(currentError.message || 'Erro ao atualizar live publico')
        }
        return null
      } finally {
        inFlightRef.current = false
        if (mountedRef.current && !silent && !hasLoadedRef.current) {
          setLoading(false)
        } else if (mountedRef.current && hasLoadedRef.current) {
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
    <div className="space-y-6 max-w-[1200px] mx-auto pb-20 px-4 sm:px-6">
      <div className="fgb-card p-8 border-t-8 border-t-[var(--verde)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <p className="fgb-label text-[var(--gray)] text-[10px] uppercase tracking-widest">
              Live Game
            </p>
            <h1 className="fgb-display text-4xl text-[var(--black)] leading-tight">
              {data.homeTeam.name} {data.homeTeam.score} x {data.awayTeam.score} {data.awayTeam.name}
            </h1>
            <p className="text-sm text-[var(--gray)]">{gameMessage(data)}</p>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-2">
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
              data.game.isLive ? 'bg-rose-100 text-rose-700' : data.game.isFinished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
            }`}>
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
            <div className="rounded-2xl border border-[var(--border)] p-4 bg-white">
              <p className="text-xs uppercase tracking-widest text-[var(--gray)] font-bold">Pontos</p>
              <p className="text-sm font-semibold text-[var(--black)]">
                {data.leaders.points ? `${data.leaders.points.athleteName} (${data.leaders.points.teamName}) - ${data.leaders.points.value}` : 'Sem lider definido'}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] p-4 bg-white">
              <p className="text-xs uppercase tracking-widest text-[var(--gray)] font-bold">Assistencias</p>
              <p className="text-sm font-semibold text-[var(--black)]">
                {data.leaders.assists ? `${data.leaders.assists.athleteName} (${data.leaders.assists.teamName}) - ${data.leaders.assists.value}` : 'Sem lider definido'}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] p-4 bg-white">
              <p className="text-xs uppercase tracking-widest text-[var(--gray)] font-bold">Rebotes</p>
              <p className="text-sm font-semibold text-[var(--black)]">
                {data.leaders.rebounds ? `${data.leaders.rebounds.athleteName} (${data.leaders.rebounds.teamName}) - ${data.leaders.rebounds.value}` : 'Sem lider definido'}
              </p>
            </div>
          </div>
        </div>

        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Play-by-play</h2>
          <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
            {data.recentEvents.map((event: any, index: number) => (
              <div key={`${event.occurredAt}-${index}`} className="rounded-2xl border border-[var(--border)] p-4 bg-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--black)]">{event.description}</p>
                  <span className="text-xs text-[var(--gray)]">P{event.period} · {event.clockTime}</span>
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

      <div className="text-xs text-[var(--gray)]">
        {updatedAt ? `Atualizado em ${new Date(updatedAt).toLocaleTimeString('pt-BR')}.` : ''}
        {' '}
        <Link className="underline" href={`/games/${gameId}/box-score`}>
          Ver box score completo
        </Link>
      </div>
    </div>
  )
}
