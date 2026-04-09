'use client'

import Link from 'next/link'
import { ArrowUpRight, CalendarDays, ShieldCheck, Trophy, Users2 } from 'lucide-react'
import { formatChampionshipStatus } from '@/lib/utils'

type Category = { id: string; name: string }

type ChampionshipCardProps = {
  id: string
  name: string
  year: number
  status: string
  categories: Category[]
  teamCount: number
  gameCount?: number
  href: string
  buttonLabel?: string
}

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  REGISTRATION_OPEN: 'bg-[var(--verde-light)] text-[var(--verde)] border-green-200',
  REGISTRATION_CLOSED: 'bg-[var(--yellow-light)] text-[var(--yellow-dark)] border-yellow-200',
  ONGOING: 'bg-[var(--red-light)] text-[var(--red)] border-red-200',
  FINISHED: 'bg-[#edf3ff] text-[#3052a5] border-[#d8e2ff]',
  ARCHIVED: 'bg-slate-50 text-slate-500 border-slate-200',
}

export function ChampionshipCard({
  id,
  name,
  year,
  status,
  categories,
  teamCount,
  gameCount,
  href,
  buttonLabel = 'Ver Painel',
}: ChampionshipCardProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[var(--shadow-premium)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--yellow)]/50"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,194,0,0.12),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(27,115,64,0.1),transparent_28%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--yellow)]/30 bg-[var(--yellow-light)] shadow-sm">
              <Trophy className="h-5 w-5 text-[var(--yellow-dark)]" />
            </div>
            <div>
              <p className="fgb-label text-[var(--verde)]" style={{ fontSize: 9 }}>
                Campeonato #{id.slice(0, 6).toUpperCase()}
              </p>
              <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0.04 }}>
                Temporada {year}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusBadge[status] || statusBadge.DRAFT}`}>
            {formatChampionshipStatus(status)}
          </span>
        </div>

        <div className="mb-5">
          <h3 className="fgb-display text-[2rem] leading-none text-[var(--black)] transition-colors duration-300 group-hover:text-[var(--verde)]">
            {name}
          </h3>
          <p className="mt-3 max-w-[28rem] text-sm leading-relaxed text-[var(--gray)]">
            Painel operacional da competição com inscrições, organização, jogos e classificação em um fluxo unificado.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-[var(--verde)]">
              <Users2 className="h-4 w-4" />
              <span className="fgb-label" style={{ fontSize: 9 }}>
                Equipes
              </span>
            </div>
            <p className="text-2xl font-black text-[var(--black)]">{teamCount}</p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white/80 p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-[var(--red)]">
              <CalendarDays className="h-4 w-4" />
              <span className="fgb-label" style={{ fontSize: 9 }}>
                Jogos
              </span>
            </div>
            <p className="text-2xl font-black text-[var(--black)]">{gameCount ?? 0}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.slice(0, 5).map((cat) => (
            <span
              key={cat.id}
              className="inline-flex rounded-full border border-[var(--border)] bg-[var(--gray-l)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--gray-d)] transition-colors group-hover:border-[var(--yellow)]/30 group-hover:bg-[var(--yellow-light)]"
            >
              {cat.name}
            </span>
          ))}
          {categories.length > 5 && (
            <span className="inline-flex rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--gray)]">
              +{categories.length - 5} categorias
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-2 text-[var(--gray)]">
            <ShieldCheck className="h-4 w-4 text-[var(--verde)]" />
            <span className="fgb-label" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0.04 }}>
              Gestão oficial FGB
            </span>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--black)] transition-all duration-300 group-hover:border-[var(--yellow)] group-hover:bg-[var(--yellow)] group-hover:text-[var(--black)]">
            {buttonLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
