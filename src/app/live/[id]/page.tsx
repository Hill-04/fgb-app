'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

type PublicLivePayload = {
  game: {
    id: string
    status: string
    homeScore: number
    awayScore: number
    homeTeam: { id: string; name: string }
    awayTeam: { id: string; name: string }
    currentPeriod?: number | null
    clockDisplay?: string | null
  }
  events?: Array<{
    period?: number | null
    clockTime?: string | null
    description?: string | null
  }>
  boxScore?: {
    players?: Array<{
      athleteId: string
      athleteName: string
      teamName?: string | null
      points?: number | null
      rebounds?: number | null
      assists?: number | null
    }>
  }
  summary?: {
    currentPeriod?: number | null
    clockDisplay?: string | null
  }
}

export default function PublicLiveProjectionPage() {
  const params = useParams<{ id: string }>()
  const routeId = params?.id
  const gameId = Array.isArray(routeId) ? routeId[0] : routeId || ''

  const [data, setData] = useState<PublicLivePayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!gameId) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/games/${gameId}/live`, {
          cache: 'no-store',
        })
        const payload = (await response.json().catch(() => ({}))) as PublicLivePayload & {
          error?: string
        }
        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao carregar live publico')
        }
        if (!cancelled) {
          setData(payload)
          setError(null)
        }
      } catch (currentError: unknown) {
        if (!cancelled) {
          setError(currentError instanceof Error ? currentError.message : 'Erro ao carregar live publico')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    const interval = window.setInterval(() => {
      void load()
    }, 3000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [gameId])

  const lastEvent = useMemo(() => {
    return data?.events?.[0] ?? null
  }, [data])

  const playerRows = useMemo(() => {
    const rows = data?.boxScore?.players ?? []
    return [...rows]
      .sort((left, right) => Number(right.points ?? 0) - Number(left.points ?? 0))
      .slice(0, 12)
  }, [data?.boxScore?.players])

  if (!gameId) {
    return <div className="p-6 text-sm text-red-700">ID de jogo invalido.</div>
  }

  if (isLoading && !data) {
    return <div className="p-6 text-sm text-[var(--gray)]">Carregando transmissao ao vivo...</div>
  }

  if (!data) {
    return <div className="p-6 text-sm text-red-700">{error || 'Sem dados publicados para este jogo.'}</div>
  }

  const currentPeriod = data.game.currentPeriod ?? data.summary?.currentPeriod ?? 0
  const clockDisplay = data.game.clockDisplay ?? data.summary?.clockDisplay ?? lastEvent?.clockTime ?? '--:--'

  return (
    <main className="min-h-screen bg-[var(--black)] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm md:p-8">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <div className="text-center md:text-left">
              <div className="text-sm uppercase tracking-[0.22em] text-white/65">Casa</div>
              <h1 className="mt-2 text-2xl font-black uppercase tracking-wide md:text-4xl">{data.game.homeTeam.name}</h1>
            </div>

            <div className="text-center">
              <div className="text-6xl font-black md:text-8xl">
                <span className="text-[#1B7340]">{data.game.homeScore}</span>
                <span className="mx-3 text-white/40">x</span>
                <span className="text-[#1B7340]">{data.game.awayScore}</span>
              </div>
              <div className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-[#F5C200]">Live</div>
            </div>

            <div className="text-center md:text-right">
              <div className="text-sm uppercase tracking-[0.22em] text-white/65">Visitante</div>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-wide md:text-4xl">{data.game.awayTeam.name}</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-black/25 p-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">Periodo</div>
              <div className="text-3xl font-black">{currentPeriod || '-'}</div>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/25 p-4 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">Clock</div>
              <div className="text-3xl font-black">{clockDisplay}</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-white/70">Ultimo evento</div>
          {lastEvent ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-semibold">{lastEvent.description || 'Evento sem descricao'}</p>
              <span className="rounded-full border border-white/20 px-3 py-1 text-sm font-bold">
                P{lastEvent.period ?? '-'} {lastEvent.clockTime || '--:--'}
              </span>
            </div>
          ) : (
            <p className="text-sm text-white/70">Nenhum evento registrado ainda.</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-white/70">Estatisticas simplificadas</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/15 text-left text-white/70">
                  <th className="px-2 py-2 font-semibold">Jogador</th>
                  <th className="px-2 py-2 font-semibold">Time</th>
                  <th className="px-2 py-2 font-semibold">PTS</th>
                  <th className="px-2 py-2 font-semibold">REB</th>
                  <th className="px-2 py-2 font-semibold">AST</th>
                </tr>
              </thead>
              <tbody>
                {playerRows.map((row) => (
                  <tr key={row.athleteId} className="border-b border-white/10">
                    <td className="px-2 py-2">{row.athleteName}</td>
                    <td className="px-2 py-2 text-white/70">{row.teamName || '-'}</td>
                    <td className="px-2 py-2 font-bold">{Number(row.points ?? 0)}</td>
                    <td className="px-2 py-2">{Number(row.rebounds ?? 0)}</td>
                    <td className="px-2 py-2">{Number(row.assists ?? 0)}</td>
                  </tr>
                ))}
                {playerRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-white/65">
                      Sem estatisticas disponiveis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {error && (
          <section className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </section>
        )}
      </div>
    </main>
  )
}

