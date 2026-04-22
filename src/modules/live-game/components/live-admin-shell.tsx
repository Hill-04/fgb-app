'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Clock3, Loader2 } from 'lucide-react'
import { buildAdminGamePath as buildCanonicalAdminGamePath } from '@/lib/admin-game-routing'
import { MODE_LABELS, type AdminViewMode } from '../types/live-admin'

type LiveAdminShellProps = {
  gameId: string
  championshipId?: string
  mode: AdminViewMode
  data: any
  game: any
  error: string
  isInitialLoading: boolean
  isRefreshingInBackground: boolean
  pendingCount: number
  onRetry: () => void
  children: ReactNode
}

function buildAdminGameModePath(gameId: string, mode: AdminViewMode, championshipId?: string) {
  const modeMap: Record<AdminViewMode, 'roster' | 'live' | 'encerramento' | 'sumula' | 'auditoria'> = {
    pregame: 'roster',
    live: 'live',
    review: 'encerramento',
    report: 'sumula',
    audit: 'auditoria',
  }

  return buildCanonicalAdminGamePath(gameId, modeMap[mode], championshipId)
}

export function LiveAdminShell({
  gameId,
  championshipId,
  mode,
  data,
  game,
  error,
  isInitialLoading,
  isRefreshingInBackground,
  pendingCount,
  onRetry,
  children,
}: LiveAdminShellProps) {
  if (isInitialLoading && !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[28px] border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="fgb-label text-[var(--gray)]">Carregando modulo live</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-700">{error || 'Falha ao carregar jogo.'}</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6">
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="fgb-label text-[var(--gray)]">{game.championship.name} - {game.category.name}</p>
        <h1 className="mt-2 fgb-display text-4xl leading-none text-[var(--black)]">
          {game.homeTeam.name} <span className="text-[var(--verde)]">{game.homeScore}</span> x <span className="text-[var(--verde)]">{game.awayScore}</span> {game.awayTeam.name}
        </h1>
        <div className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--gray-l)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
          Etapa atual: {MODE_LABELS[mode]}
        </div>
        <p className="mt-3 text-sm text-[var(--gray)]">
          Status {game.liveStatus} - Periodo {game.currentPeriod || 0} - Relogio {game.clockDisplay || '10:00'}
          {mode === 'live' && pendingCount > 0 && (
            <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-yellow-700">
              <Clock3 className="h-3 w-3" />
              {pendingCount} sincronizando
            </span>
          )}
          {mode === 'live' && isRefreshingInBackground && pendingCount === 0 && (
            <span className="ml-3 inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sincronizando
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={buildAdminGameModePath(gameId, 'pregame', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Pre-jogo</Link>
        <Link href={buildAdminGameModePath(gameId, 'live', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Mesa</Link>
        <Link href={buildAdminGameModePath(gameId, 'review', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Encerramento</Link>
        <Link href={buildAdminGameModePath(gameId, 'report', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Sumula</Link>
        <Link href={buildAdminGameModePath(gameId, 'audit', championshipId)} className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">Auditoria</Link>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {children}
    </div>
  )
}
