import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ClipboardList, Trophy, CheckCircle2, Clock, XCircle, ChevronRight, Tag } from 'lucide-react'

const STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Confirmada',
    icon: CheckCircle2,
    card: 'border-l-[var(--verde)]',
    badge: 'bg-[var(--verde)]/10 text-[var(--verde)] border-[var(--verde)]/20',
    iconColor: 'text-[var(--verde)]',
  },
  PENDING: {
    label: 'Pendente',
    icon: Clock,
    card: 'border-l-[var(--yellow)]',
    badge: 'bg-[var(--yellow)]/20 text-[var(--black)] border-[var(--yellow)]/40',
    iconColor: 'text-[var(--black)]',
  },
  REJECTED: {
    label: 'Recusada',
    icon: XCircle,
    card: 'border-l-[var(--red)]',
    badge: 'bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/20',
    iconColor: 'text-[var(--red)]',
  },
} as const

export const dynamic = 'force-dynamic'

export default async function TeamRegistrationsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') redirect('/login')

  const teamId = (session.user as any).teamId
  if (!teamId) redirect('/team/onboarding')

  const registrations = await prisma.registration.findMany({
    where: { teamId },
    include: {
      championship: {
        select: {
          id: true,
          name: true,
          year: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      },
      categories: {
        include: {
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { registeredAt: 'desc' },
  })

  const confirmed = registrations.filter(r => r.status === 'CONFIRMED')
  const pending   = registrations.filter(r => r.status === 'PENDING')
  const rejected  = registrations.filter(r => r.status === 'REJECTED')

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>Minha Equipe</span>
            <span className="fgb-badge fgb-badge-verde">INSCRIÇÕES</span>
          </div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Minhas Inscrições</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Acompanhe o status de todas as inscrições da sua equipe
          </p>
        </div>
        <Link href="/team/championships" className="fgb-btn-primary h-11 px-6 text-sm self-start md:self-auto">
          + Nova Inscrição
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Confirmadas', count: confirmed.length, color: 'border-t-[var(--verde)]', text: 'text-[var(--verde)]' },
          { label: 'Pendentes',   count: pending.length,   color: 'border-t-[var(--yellow)]', text: 'text-[var(--black)]' },
          { label: 'Recusadas',   count: rejected.length,  color: 'border-t-[var(--red)]',    text: 'text-[var(--red)]' },
        ].map(item => (
          <div key={item.label} className={`fgb-card bg-white p-5 border-t-[3px] ${item.color}`}>
            <p className={`fgb-display text-3xl leading-none ${item.text}`}>{item.count}</p>
            <p className="fgb-label text-[var(--gray)] mt-2" style={{ fontSize: 9 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {registrations.length === 0 ? (
        <div className="fgb-card bg-white p-20 text-center">
          <ClipboardList className="w-12 h-12 text-[var(--gray)] mx-auto mb-4 opacity-30" />
          <h3 className="fgb-display text-lg text-[var(--black)] mb-2">Nenhuma inscrição ainda</h3>
          <p className="fgb-label text-[var(--gray)] mb-6" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Sua equipe ainda não se inscreveu em nenhum campeonato.
          </p>
          <Link href="/team/championships" className="fgb-btn-primary h-11 px-8">
            Ver Campeonatos Disponíveis
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map(reg => {
            const cfg = STATUS_CONFIG[reg.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING
            const Icon = cfg.icon
            const champStatus: Record<string, string> = {
              REGISTRATION_OPEN:   'Inscrições Abertas',
              REGISTRATION_CLOSED: 'Inscrições Encerradas',
              ONGOING:             'Em Andamento',
              FINISHED:            'Encerrado',
              DRAFT:               'Rascunho',
            }

            return (
              <div
                key={reg.id}
                className={`fgb-card bg-white p-6 border-l-4 ${cfg.card} hover:shadow-md transition-all`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-[var(--gray)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="fgb-display text-base text-[var(--black)] leading-none">
                          {reg.championship.name}
                        </h3>
                        <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>
                          {reg.championship.year}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* Status da inscrição */}
                        <span className={`inline-flex items-center gap-1 fgb-label px-2 py-1 rounded-full border ${cfg.badge}`} style={{ fontSize: 9 }}>
                          <Icon className={`w-3 h-3 ${cfg.iconColor}`} />
                          {cfg.label}
                        </span>
                        {/* Status do campeonato */}
                        <span className="fgb-badge fgb-badge-outline">
                          {champStatus[reg.championship.status] ?? reg.championship.status}
                        </span>
                      </div>

                      {/* Categorias inscritas */}
                      {reg.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {reg.categories.map((rc: any) => (
                            <span key={rc.category.id} className="inline-flex items-center gap-1 bg-[var(--gray-l)] border border-[var(--border)] px-2 py-0.5 rounded-full fgb-label" style={{ fontSize: 9 }}>
                              <Tag className="w-2.5 h-2.5 text-[var(--gray)]" />
                              {rc.category.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Datas */}
                      {(reg.championship.startDate || reg.championship.endDate) && (
                        <p className="fgb-label text-[var(--gray)] mt-2" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
                          {reg.championship.startDate
                            ? new Date(reg.championship.startDate).toLocaleDateString('pt-BR')
                            : '—'}
                          {reg.championship.endDate && ` → ${new Date(reg.championship.endDate).toLocaleDateString('pt-BR')}`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/team/championships`}
                    className="flex items-center gap-1 fgb-label text-[var(--gray)] hover:text-[var(--black)] transition-colors flex-shrink-0"
                    style={{ fontSize: 10 }}
                  >
                    Ver campeonato <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
