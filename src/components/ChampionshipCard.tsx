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
  ORGANIZING: 'bg-blue-100 text-blue-700 border-blue-200',
  ONGOING: 'bg-[var(--verde-light)] text-[var(--verde)] border-green-200',
  ACTIVE: 'bg-[var(--verde-light)] text-[var(--verde)] border-green-200',
  FINISHED: 'bg-[#edf3ff] text-[#3052a5] border-[#d8e2ff]',
  ARCHIVED: 'bg-slate-50 text-slate-500 border-slate-200',
}

const actionLabelMap: Record<string, string> = {
  REGISTRATION_OPEN: 'Gerenciar Inscrições',
  REGISTRATION_CLOSED: 'Organizar com IA',
  ORGANIZING: 'Revisar Calendário',
  ONGOING: 'Registrar Resultados',
  ACTIVE: 'Registrar Resultados',
  FINISHED: 'Ver Relatório',
}

const statusStepMap: Record<string, number> = {
  DRAFT: 1,
  REGISTRATION_OPEN: 2,
  REGISTRATION_CLOSED: 2,
  ORGANIZING: 3,
  ONGOING: 4,
  ACTIVE: 4,
  FINISHED: 5,
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
  buttonLabel,
}: ChampionshipCardProps) {
  const currentStep = statusStepMap[status] ?? 1
  const actionLabel = buttonLabel ?? actionLabelMap[status] ?? 'Ver Painel'
  const showPulse = status === 'REGISTRATION_OPEN' || status === 'ONGOING' || status === 'ACTIVE'

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

          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${statusBadge[status] || statusBadge.DRAFT}`}>
            {showPulse && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--verde)] opacity-70"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--verde)]"></span>
              </span>
            )}
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

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Progresso do campeonato</p>
            <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>
              Etapa {currentStep}/5
            </span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((step) => (
              <span
                key={step}
                className={`h-2 flex-1 rounded-full border ${step <= currentStep ? 'bg-[var(--verde)] border-[var(--verde)]' : 'bg-white border-[var(--border)]'}`}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">
            <span>Criação</span>
            <span>Inscrições</span>
            <span>Organização</span>
            <span>Jogos</span>
            <span>Encerrado</span>
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
            {actionLabel}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
