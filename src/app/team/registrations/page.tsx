import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ClipboardList, Trophy, CheckCircle2, Clock, XCircle, ChevronRight, Tag, Wallet, Send, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react'
import { TeamPageHeader } from '@/components/team/team-page-header'
import { formatCurrencyBRL, summarizeRegistrationFees } from '@/lib/fees'
import {
  deriveLifecycleFromLegacy,
  getStateLabel,
  type RegistrationLifecycleState,
} from '@/lib/registration-lifecycle'

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
      fees: {
        select: {
          feeKey: true,
          feeLabel: true,
          quantity: true,
          unitValue: true,
          totalValue: true,
          status: true,
          paidAt: true,
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
      <TeamPageHeader
        eyebrow="Minha Equipe"
        eyebrowTone="green"
        badge="Inscrições"
        title="Minhas Inscrições"
        description="Acompanhe o status de todas as inscrições da sua equipe."
        icon={<ClipboardList className="w-4 h-4" />}
        actions={
          <Link href="/team/campeonatos?tab=fgb" className="fgb-btn-primary h-11 px-6 text-sm">
            + Nova Inscrição
          </Link>
        }
      />

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
          <Link href="/team/campeonatos?tab=fgb" className="fgb-btn-primary h-11 px-8">
            Ver Campeonatos Disponíveis
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map(reg => {
            const cfg = STATUS_CONFIG[reg.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING
            const Icon = cfg.icon
            const feeSummary = summarizeRegistrationFees(reg.fees as any)
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
                        <span className="inline-flex items-center gap-1 rounded-full border border-fgb-yellow-200 bg-fgb-yellow-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-fgb-yellow-700">
                          <Wallet className="h-3 w-3" />
                          Total {formatCurrencyBRL(feeSummary.total)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-red-700">
                          Pendente {formatCurrencyBRL(feeSummary.pendingTotal)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-green-700">
                          Pago {formatCurrencyBRL(feeSummary.paidTotal)}
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

                      {/* Fase 6.E — Timeline de lifecycle */}
                      <RegistrationTimeline reg={reg as any} />
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/team/registrations/${reg.id}/fees`}
                    className="flex items-center gap-1 fgb-label text-[var(--gray)] hover:text-[var(--black)] transition-colors flex-shrink-0"
                    style={{ fontSize: 10 }}
                  >
                    Ver taxas <ChevronRight className="w-3.5 h-3.5" />
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

// ─────────────── Timeline de lifecycle (Fase 6.E) ───────────────

function RegistrationTimeline({
  reg,
}: {
  reg: {
    status: string
    lifecycleState?: string | null
    registeredAt: Date
    submittedAt?: Date | null
    confirmedAt?: Date | null
    rejectedAt?: Date | null
    rejectionReason?: string | null
  }
}) {
  const state = (reg.lifecycleState as RegistrationLifecycleState | undefined)
    ?? deriveLifecycleFromLegacy({ status: reg.status })

  const fmt = (d?: Date | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null

  const submittedDate = fmt(reg.submittedAt) ?? fmt(reg.registeredAt)
  const confirmedDate = fmt(reg.confirmedAt)
  const rejectedDate = fmt(reg.rejectedAt)

  // Steps a renderizar
  type Step = {
    icon: any
    label: string
    detail?: string | null
    tone: 'done' | 'current' | 'future' | 'error'
  }

  const steps: Step[] = [
    {
      icon: Send,
      label: 'Submetida',
      detail: submittedDate,
      tone: 'done',
    },
  ]

  if (state === 'UNDER_REVIEW') {
    steps.push({ icon: RotateCcw, label: 'Em análise', tone: 'current' })
  }

  if (state === 'CONFIRMED') {
    steps.push({
      icon: CheckCircle2,
      label: 'Confirmada',
      detail: confirmedDate,
      tone: 'done',
    })
  }

  if (state === 'REJECTED') {
    steps.push({
      icon: XCircle,
      label: 'Recusada',
      detail: rejectedDate,
      tone: 'error',
    })
  }

  if (state === 'CANCELLED') {
    steps.push({
      icon: AlertTriangle,
      label: 'Cancelada',
      detail: rejectedDate,
      tone: 'error',
    })
  }

  // Se está em SUBMITTED (sem decisão), adiciona próximo step pendente
  if (state === 'SUBMITTED') {
    steps.push({ icon: ShieldCheck, label: 'Aguardando análise', tone: 'current' })
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--border)]">
      <div className="flex items-center gap-3 flex-wrap">
        {steps.map((step, i) => {
          const Icon = step.icon
          const tone = step.tone
          const color =
            tone === 'done'
              ? 'var(--fgb-green-700)'
              : tone === 'current'
                ? 'var(--fgb-yellow-700)'
                : tone === 'error'
                  ? 'var(--fgb-red-600)'
                  : 'var(--fgb-ink-400)'

          return (
            <div key={i} className="inline-flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: tone === 'future' ? 'transparent' : `${color}20`,
                  border: `1.5px solid ${color}`,
                  color,
                }}
              >
                <Icon size={11} aria-hidden />
              </span>
              <div className="leading-tight">
                <p
                  className="fgb-label"
                  style={{ fontSize: 9, color, letterSpacing: '0.16em', lineHeight: 1 }}
                >
                  {step.label}
                </p>
                {step.detail && (
                  <p
                    className="fgb-label"
                    style={{
                      fontSize: 8,
                      color: 'var(--fgb-ink-400)',
                      textTransform: 'none',
                      letterSpacing: 0,
                      fontFamily: 'var(--font-mono)',
                      marginTop: 1,
                    }}
                  >
                    {step.detail}
                  </p>
                )}
              </div>
              {i < steps.length - 1 && (
                <span
                  className="inline-block"
                  style={{
                    width: 16,
                    height: 1,
                    background: 'var(--fgb-ink-200)',
                  }}
                  aria-hidden
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Motivo de recusa (se aplicável) */}
      {state === 'REJECTED' && reg.rejectionReason && (
        <div
          className="mt-3 p-3 rounded-md flex items-start gap-2"
          style={{ background: 'var(--fgb-red-50)', border: '1px solid var(--fgb-red-200)' }}
        >
          <AlertTriangle
            size={14}
            style={{ color: 'var(--fgb-red-700)', flexShrink: 0, marginTop: 2 }}
            aria-hidden
          />
          <div className="min-w-0">
            <p
              className="fgb-label"
              style={{ fontSize: 9, color: 'var(--fgb-red-700)', letterSpacing: '0.18em' }}
            >
              Motivo da recusa
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--fgb-ink-900)', lineHeight: 1.5 }}>
              {reg.rejectionReason}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
