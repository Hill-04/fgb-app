'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

type PublicMode = 'live' | 'box-score' | 'play-by-play'

export function LiveGamePublicView({ gameId, mode }: { gameId: string; mode: PublicMode }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}/live`, { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || 'Falha ao carregar jogo')
        if (mounted) {
          setData(payload)
          setError('')
        }
      } catch (currentError: any) {
        if (mounted) setError(currentError.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 8000)
    return () => {
      mounted = false
      clearInterval(interval)
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

  const { game } = data

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="fgb-label text-[var(--gray)]">{game.championship.name} · {game.category.name}</p>
        <h1 className="mt-2 fgb-display text-4xl leading-none text-[var(--black)]">
          {game.homeTeam.name} <span className="text-[var(--verde)]">{game.homeScore}</span> × <span className="text-[var(--verde)]">{game.awayScore}</span> {game.awayTeam.name}
        </h1>
        <p className="mt-3 text-sm text-[var(--gray)]">Status {game.liveStatus} · Período {game.currentPeriod || 0} · Relógio {game.clockDisplay || '10:00'}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/games/${gameId}/live`} className="rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Ao vivo</Link>
          <Link href={`/games/${gameId}/box-score`} className="rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Box score</Link>
          <Link href={`/games/${gameId}/play-by-play`} className="rounded-xl border border-[var(--border)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Play-by-play</Link>
        </div>
      </div>

      {mode === 'live' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Play-by-play</h2>
            <div className="mt-5 space-y-3">
              {[...(data.events || [])].reverse().slice(0, 20).map((event: any) => (
                <div key={event.id} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--black)]">{event.description}</p>
                    <span className="text-xs text-[var(--gray)]">P{event.period} · {event.clockTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Leaders</h2>
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
          </div>
        </div>
      )}

      {mode === 'box-score' && (
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Totais por equipe</h2>
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

      {mode === 'play-by-play' && (
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Linha do tempo</h2>
          <div className="mt-5 space-y-3">
            {[...(data.events || [])].reverse().map((event: any) => (
              <div key={event.id} className="rounded-2xl border border-[var(--border)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--black)]">{event.description}</p>
                  <span className="text-xs text-[var(--gray)]">P{event.period} · {event.clockTime}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--gray)]">{event.eventType}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
