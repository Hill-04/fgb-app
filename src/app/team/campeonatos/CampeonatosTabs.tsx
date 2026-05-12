'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Trophy,
  Users,
} from 'lucide-react'
import { TeamCompetitionsClient } from './TeamCompetitionsClient'

type Tab = 'fgb' | 'externos'

type FGBChampionship = {
  id: string
  name: string
  description: string | null
  sex: string
  status: string
  regDeadline: string | null
  minTeamsPerCat: number
  registrationsCount: number
  categories: { id: string; name: string; registrationsCount: number }[]
  isRegistered: boolean
  isBlocked: boolean
  blocksCount: number
}

type ExternalCompetition = {
  id: string
  name: string
  organizer: string
  city: string | null
  state: string | null
  startDate: string
  endDate: string
  websiteUrl: string | null
  categories: string[]
  blocks: { championshipId: string; championshipName: string }[]
  declaredCount: number
}

type Athlete = {
  id: string
  name: string
  sex: string | null
  birthDate: string | null
}

type Props = {
  initialTab: Tab
  fgbChampionships: FGBChampionship[]
  externalCompetitions: ExternalCompetition[]
  athletes: Athlete[]
  teamId: string
}

export function CampeonatosTabs({
  initialTab,
  fgbChampionships,
  externalCompetitions,
  athletes,
  teamId,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [, startTransition] = useTransition()

  const changeTab = (next: Tab) => {
    setTab(next)
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.set('tab', next)
    startTransition(() => {
      router.replace(`/team/campeonatos?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-1" role="tablist" aria-label="Campeonatos">
          <TabButton active={tab === 'fgb'} onClick={() => changeTab('fgb')}>
            FGB{' '}
            <span className="ml-1 text-[var(--gray)] font-bold">
              ({fgbChampionships.length})
            </span>
          </TabButton>
          <TabButton active={tab === 'externos'} onClick={() => changeTab('externos')}>
            Externos{' '}
            <span className="ml-1 text-[var(--gray)] font-bold">
              ({externalCompetitions.length})
            </span>
          </TabButton>
        </div>
      </div>

      {tab === 'fgb' ? (
        <FGBSection items={fgbChampionships} />
      ) : (
        <ExternosSection
          items={externalCompetitions}
          athletes={athletes}
          teamId={teamId}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative -mb-px px-5 py-3 text-sm font-display font-black italic uppercase tracking-tight transition-colors ${
        active
          ? 'text-[var(--black)] border-b-2 border-fgb-yellow-500'
          : 'text-[var(--gray)] hover:text-[var(--black)] border-b-2 border-transparent'
      }`}
    >
      {children}
    </button>
  )
}

function FGBSection({ items }: { items: FGBChampionship[] }) {
  if (items.length === 0) {
    return (
      <div className="fgb-card bg-[var(--gray-l)] border border-[var(--border)] rounded-3xl p-20 text-center shadow-sm">
        <Trophy className="w-16 h-16 text-fgb-ink-300 mx-auto mb-6" />
        <h3 className="text-xl font-bold text-[var(--black)] mb-2">
          Nenhum campeonato com inscrições abertas
        </h3>
        <p className="text-[var(--gray)] text-sm max-w-md mx-auto">
          No momento não há campeonatos disponíveis. A Federação avisará quando houver novas inscrições.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {items.map((c) => (
        <div
          key={c.id}
          className="fgb-card bg-white border border-[var(--border)] rounded-3xl overflow-hidden hover:border-fgb-yellow-300 transition-all duration-300 group relative shadow-sm"
        >
          {c.isRegistered && (
            <div className="absolute top-0 right-0 bg-[var(--verde)] text-white px-6 py-2 rounded-bl-3xl font-black italic uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              Inscrito
            </div>
          )}
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center rounded-full bg-fgb-yellow-50 px-3 py-1 text-xs font-bold text-fgb-yellow-600 border border-fgb-yellow-200 uppercase tracking-widest">
                    {c.status === 'REGISTRATION_OPEN' ? 'Inscrições Abertas' : 'Em Andamento'}
                  </span>
                  <span className="text-[var(--gray)] text-xs font-bold uppercase tracking-widest">
                    {c.sex === 'masculino'
                      ? 'Masculino'
                      : c.sex === 'feminino'
                        ? 'Feminino'
                        : 'Misto'}
                  </span>
                </div>
                <h2 className="text-2xl font-display font-black text-[var(--black)] mb-2 group-hover:text-fgb-yellow-600 transition-colors uppercase italic">
                  {c.name}
                </h2>
                {c.description && (
                  <p className="text-[var(--gray)] text-sm mb-4 line-clamp-2">
                    {c.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs font-bold text-[var(--gray)] mb-6">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-[var(--verde)]" />
                    Mín. {c.minTeamsPerCat} equipes/categoria
                  </span>
                  {c.regDeadline && (
                    <span className="flex items-center gap-1.5 text-fgb-yellow-600">
                      <Calendar className="w-3 h-3" />
                      Prazo: {new Date(c.regDeadline).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-[var(--amarelo)]" />
                    {c.registrationsCount} inscrição(ões)
                  </span>
                </div>

                {c.isBlocked && (
                  <div
                    className="mb-4 text-xs p-3 rounded-lg flex items-start gap-2"
                    style={{ background: 'rgba(204,16,22,0.08)', color: 'var(--red)' }}
                  >
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      {c.blocksCount} atleta(s) bloqueada(s) por declaração em competição externa.
                    </span>
                  </div>
                )}

                {c.categories.length > 0 && (
                  <div>
                    <p className="fgb-label text-[10px] font-black text-[var(--gray)] uppercase tracking-widest mb-3">
                      Categorias disponíveis
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="bg-[var(--gray-l)] border border-[var(--border)] rounded-xl px-3 py-2 hover:bg-fgb-yellow-50 hover:border-fgb-yellow-200 transition-all shadow-inner"
                        >
                          <p className="text-xs font-bold text-[var(--black)]">{cat.name}</p>
                          <p className="text-[10px] text-[var(--gray)] mt-0.5">
                            {cat.registrationsCount} equipe(s)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:ml-8 shrink-0 flex flex-col justify-center">
                {c.isRegistered ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-inner">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-5 h-5 text-green-700" />
                    </div>
                    <p className="text-sm font-bold text-green-800 uppercase italic tracking-tight">
                      Equipe Inscrita
                    </p>
                    <p className="text-[10px] text-green-600/80 mt-1">Aguardando validação</p>
                  </div>
                ) : (
                  <Link
                    href={`/team/campeonatos/${c.id}/register`}
                    className="fgb-btn-primary inline-flex items-center justify-center italic tracking-tighter h-14 px-10 text-lg hover:scale-105 active:scale-95"
                  >
                    Inscrever agora
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ExternosSection({
  items,
  athletes,
  teamId,
}: {
  items: ExternalCompetition[]
  athletes: Athlete[]
  teamId: string
}) {
  return (
    <div className="space-y-6">
      <div
        className="rounded-lg p-5 flex items-start gap-3"
        style={{ background: 'rgba(245,194,0,0.1)', borderLeft: '5px solid #E5AB00' }}
      >
        <AlertTriangle size={28} style={{ color: '#CC7A00' }} className="flex-shrink-0" />
        <div>
          <h3 className="fgb-display text-[16px] text-[var(--black)] mb-1">
            ATENÇÃO — EXCLUSIVIDADE DE INSCRIÇÃO
          </h3>
          <p className="text-sm text-[var(--black)]">
            As competições abaixo são organizadas por terceiros. A inscrição nessas competições
            <strong> BLOQUEIA</strong> a participação nos campeonatos da FGB. Escolha com atenção.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="fgb-card p-6 text-center text-[var(--gray)]">
          Nenhuma competição externa cadastrada.
        </div>
      ) : (
        <TeamCompetitionsClient externals={items} athletes={athletes} teamId={teamId} />
      )}

      <div className="text-center pt-4">
        <Link
          href="/team/campeonatos/declarations"
          className="text-[var(--verde)] font-semibold text-sm flex items-center justify-center gap-1"
        >
          <ExternalLink size={14} />
          Gerenciar minhas declarações
        </Link>
      </div>
    </div>
  )
}
