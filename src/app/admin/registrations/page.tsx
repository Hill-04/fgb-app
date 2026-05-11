import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ClipboardList, Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ChevronRight, Send } from 'lucide-react'
import {
  deriveLifecycleFromLegacy,
  type RegistrationLifecycleState,
} from '@/lib/registration-lifecycle'

export const metadata: Metadata = {
  title: 'Inscrições — Admin FGB',
  description: 'Dashboard centralizado de inscrições em todos os campeonatos.',
}

export const dynamic = 'force-dynamic'

export default async function AdminRegistrationsDashboard() {
  const registrations = await prisma.registration
    .findMany({
      include: {
        team: { select: { id: true, name: true } },
        championship: { select: { id: true, name: true, year: true } },
      },
      orderBy: { registeredAt: 'desc' },
      take: 200,
    })
    .catch(() => [])

  // Computa lifecycle state derivado (fallback se backfill ainda não rodou)
  const enriched = registrations.map(r => ({
    ...r,
    state: ((r as any).lifecycleState as RegistrationLifecycleState | null)
      ?? deriveLifecycleFromLegacy({ status: r.status }),
  }))

  const buckets = {
    SUBMITTED: enriched.filter(r => r.state === 'SUBMITTED'),
    UNDER_REVIEW: enriched.filter(r => r.state === 'UNDER_REVIEW'),
    CONFIRMED: enriched.filter(r => r.state === 'CONFIRMED'),
    REJECTED: enriched.filter(r => r.state === 'REJECTED'),
    CANCELLED: enriched.filter(r => r.state === 'CANCELLED'),
    DRAFT: enriched.filter(r => r.state === 'DRAFT'),
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentConfirmed = enriched.filter(
    r => r.state === 'CONFIRMED' && (r as any).confirmedAt && new Date((r as any).confirmedAt) >= sevenDaysAgo,
  )
  const recentRejected = enriched.filter(
    r => r.state === 'REJECTED' && (r as any).rejectedAt && new Date((r as any).rejectedAt) >= sevenDaysAgo,
  )

  const fila = [...buckets.SUBMITTED, ...buckets.UNDER_REVIEW].sort((a, b) => {
    const ad = (a as any).submittedAt ?? a.registeredAt
    const bd = (b as any).submittedAt ?? b.registeredAt
    return new Date(ad).getTime() - new Date(bd).getTime()
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--fgb-green-700)' }} aria-hidden />
          <span className="fgb-label" style={{ fontSize: 10, color: 'var(--fgb-green-700)', letterSpacing: '0.22em' }}>
            Admin · Inscrições
          </span>
        </div>
        <h1 className="fgb-display" style={{ fontSize: 32, color: 'var(--fgb-ink-900)' }}>
          Painel de Inscrições
        </h1>
        <p className="fgb-label mt-1" style={{ fontSize: 11, color: 'var(--fgb-ink-500)', letterSpacing: 0, textTransform: 'none' }}>
          Visão consolidada de todas as inscrições em todos os campeonatos.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard icon={<Send size={14} />} label="Submetidas" count={buckets.SUBMITTED.length} tone="warning" subtitle="aguardando análise" />
        <KpiCard icon={<Clock size={14} />} label="Em análise" count={buckets.UNDER_REVIEW.length} tone="warning" subtitle="revisão em andamento" />
        <KpiCard icon={<CheckCircle2 size={14} />} label="Confirmadas" count={buckets.CONFIRMED.length} tone="ok" subtitle={`${recentConfirmed.length} na última semana`} />
        <KpiCard icon={<XCircle size={14} />} label="Recusadas" count={buckets.REJECTED.length} tone="error" subtitle={`${recentRejected.length} na última semana`} />
        <KpiCard icon={<AlertTriangle size={14} />} label="Canceladas" count={buckets.CANCELLED.length} tone="neutral" subtitle="encerradas" />
      </div>

      {/* Fila prioritária */}
      <section className="fgb-card overflow-hidden" style={{ background: '#fff' }}>
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'var(--fgb-yellow-50)', borderBottom: '1px solid var(--fgb-yellow-200)' }}
        >
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: 'var(--fgb-yellow-700)' }} aria-hidden />
            <h2 style={{ fontFamily: 'var(--font-anton)', fontSize: 18, textTransform: 'uppercase', color: 'var(--fgb-ink-900)', lineHeight: 1 }}>
              Fila de análise
            </h2>
            <span className="fgb-label" style={{ fontSize: 9, color: 'var(--fgb-yellow-700)', letterSpacing: '0.18em' }}>
              {fila.length} pendentes
            </span>
          </div>
        </div>

        {fila.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <ClipboardList size={32} className="mx-auto mb-2" style={{ color: 'var(--fgb-ink-300)' }} aria-hidden />
            <p className="fgb-label" style={{ fontSize: 10, color: 'var(--fgb-ink-500)', letterSpacing: '0.18em' }}>
              Nenhuma inscrição aguardando análise
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--fgb-ink-100)' }}>
            {fila.slice(0, 20).map(r => {
              const submitted = (r as any).submittedAt ?? r.registeredAt
              const ageDays = Math.floor((Date.now() - new Date(submitted).getTime()) / (1000 * 60 * 60 * 24))
              const urgent = ageDays > 7

              return (
                <li key={r.id}>
                  <Link
                    href={`/admin/championships/${r.championship.id}/registrations`}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-[var(--fgb-ink-50)]"
                  >
                    <span
                      className="fgb-label shrink-0 inline-flex items-center justify-center"
                      style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: r.state === 'UNDER_REVIEW' ? 'var(--fgb-yellow-100)' : 'var(--fgb-yellow-50)',
                        color: 'var(--fgb-yellow-700)', fontSize: 8, letterSpacing: '0.18em',
                      }}
                    >
                      {r.state === 'UNDER_REVIEW' ? 'REV' : 'NEW'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--fgb-ink-900)' }}>
                        {r.team.name}
                      </p>
                      <p className="fgb-label mt-0.5 truncate" style={{ fontSize: 9, color: 'var(--fgb-ink-500)', textTransform: 'none', letterSpacing: 0 }}>
                        {r.championship.name} · {r.championship.year}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="fgb-label"
                        style={{
                          fontSize: 9,
                          color: urgent ? 'var(--fgb-red-600)' : 'var(--fgb-ink-400)',
                          letterSpacing: '0.12em',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {ageDays === 0 ? 'hoje' : `${ageDays}d atrás`}
                      </span>
                      {urgent && (
                        <span className="fgb-label" style={{ fontSize: 8, color: 'var(--fgb-red-700)', letterSpacing: '0.22em' }}>
                          atenção
                        </span>
                      )}
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--fgb-ink-400)' }} aria-hidden />
                  </Link>
                </li>
              )
            })}
            {fila.length > 20 && (
              <li className="px-5 py-2 text-center fgb-label" style={{ fontSize: 9, color: 'var(--fgb-ink-400)', letterSpacing: '0.18em' }}>
                + {fila.length - 20} pendentes na fila
              </li>
            )}
          </ul>
        )}
      </section>

      {/* Atividade recente */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ActivityBox
          title="Confirmações recentes"
          subtitle="últimos 7 dias"
          icon={<CheckCircle2 size={14} style={{ color: 'var(--fgb-green-700)' }} aria-hidden />}
          tone="ok"
          items={recentConfirmed.slice(0, 6).map(r => ({
            id: r.id,
            primary: r.team.name,
            secondary: `${r.championship.name} · ${r.championship.year}`,
            date: (r as any).confirmedAt,
            href: `/admin/championships/${r.championship.id}/registrations`,
          }))}
        />
        <ActivityBox
          title="Recusas recentes"
          subtitle="últimos 7 dias"
          icon={<XCircle size={14} style={{ color: 'var(--fgb-red-700)' }} aria-hidden />}
          tone="error"
          items={recentRejected.slice(0, 6).map(r => {
            const reason = (r as any).rejectionReason as string | null
            return {
              id: r.id,
              primary: r.team.name,
              secondary: reason
                ? `${r.championship.name} · ${reason.slice(0, 60)}${reason.length > 60 ? '…' : ''}`
                : `${r.championship.name} · ${r.championship.year}`,
              date: (r as any).rejectedAt,
              href: `/admin/championships/${r.championship.id}/registrations`,
            }
          })}
        />
      </section>
    </div>
  )
}

function KpiCard({
  icon, label, count, subtitle, tone,
}: {
  icon: React.ReactNode
  label: string
  count: number
  subtitle: string
  tone: 'ok' | 'warning' | 'error' | 'neutral'
}) {
  const valueColor =
    tone === 'ok' ? 'var(--fgb-green-700)' :
    tone === 'warning' ? 'var(--fgb-yellow-700)' :
    tone === 'error' ? 'var(--fgb-red-600)' :
    'var(--fgb-ink-700)'

  return (
    <div className="fgb-card p-4" style={{ background: '#fff', border: '1px solid var(--fgb-ink-200)' }}>
      <div className="fgb-label inline-flex items-center gap-1.5 mb-2" style={{ fontSize: 9, color: 'var(--fgb-ink-500)', letterSpacing: '0.18em' }}>
        <span style={{ color: valueColor }}>{icon}</span>
        {label}
      </div>
      <div className="tabular-nums" style={{ fontFamily: 'var(--font-anton)', fontSize: 32, lineHeight: 1, color: valueColor }}>
        {count}
      </div>
      <p className="fgb-label mt-1" style={{ fontSize: 9, color: 'var(--fgb-ink-400)', textTransform: 'none', letterSpacing: 0 }}>
        {subtitle}
      </p>
    </div>
  )
}

function ActivityBox({
  title, subtitle, icon, tone, items,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  tone: 'ok' | 'error'
  items: Array<{ id: string; primary: string; secondary: string; date?: Date | null; href: string }>
}) {
  const headerBg = tone === 'ok' ? 'var(--fgb-green-50)' : 'var(--fgb-red-50)'
  const headerBorder = tone === 'ok' ? 'var(--fgb-green-200)' : 'var(--fgb-red-200)'

  return (
    <div className="fgb-card overflow-hidden" style={{ background: '#fff' }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}` }}>
        {icon}
        <h3 style={{ fontFamily: 'var(--font-anton)', fontSize: 14, textTransform: 'uppercase', color: 'var(--fgb-ink-900)', lineHeight: 1 }}>
          {title}
        </h3>
        <span className="fgb-label ml-auto" style={{ fontSize: 9, color: 'var(--fgb-ink-500)', letterSpacing: '0.18em' }}>
          {subtitle}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-6 text-center fgb-label" style={{ fontSize: 10, color: 'var(--fgb-ink-400)', letterSpacing: '0.18em' }}>
          Nenhuma atividade
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--fgb-ink-100)' }}>
          {items.map(item => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 px-5 py-2.5 transition-colors hover:bg-[var(--fgb-ink-50)]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--fgb-ink-900)' }}>
                    {item.primary}
                  </p>
                  <p className="fgb-label truncate" style={{ fontSize: 9, color: 'var(--fgb-ink-500)', textTransform: 'none', letterSpacing: 0 }}>
                    {item.secondary}
                  </p>
                </div>
                {item.date && (
                  <span className="fgb-label shrink-0" style={{ fontSize: 9, color: 'var(--fgb-ink-400)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
