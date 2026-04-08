import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, CheckCircle2, Clock, XCircle, ChevronRight, Trophy, Tag } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Confirmada',
    badge: 'bg-[var(--verde)]/10 text-[var(--verde)] border-[var(--verde)]/20',
    icon: CheckCircle2,
    iconColor: 'text-[var(--verde)]',
  },
  PENDING: {
    label: 'Pendente',
    badge: 'bg-[var(--yellow)]/20 text-[var(--black)] border-[var(--yellow)]/40',
    icon: Clock,
    iconColor: 'text-[var(--black)]',
  },
  REJECTED: {
    label: 'Recusada',
    badge: 'bg-[var(--red)]/10 text-[var(--red)] border-[var(--red)]/20',
    icon: XCircle,
    iconColor: 'text-[var(--red)]',
  },
} as const

export default async function AdminRegistrationsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) redirect('/login')

  const registrations = await prisma.registration.findMany({
    include: {
      team: { select: { id: true, name: true, logoUrl: true, city: true } },
      championship: { select: { id: true, name: true, year: true, status: true } },
      categories: {
        include: { category: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalConfirmed = registrations.filter(r => r.status === 'CONFIRMED').length
  const totalPending   = registrations.filter(r => r.status === 'PENDING').length
  const totalRejected  = registrations.filter(r => r.status === 'REJECTED').length

  // Group by championship for the display
  const byChampionship = registrations.reduce((acc, reg) => {
    const key = reg.championship.id
    if (!acc[key]) acc[key] = { championship: reg.championship, items: [] }
    acc[key].items.push(reg)
    return acc
  }, {} as Record<string, { championship: typeof registrations[0]['championship']; items: typeof registrations }>)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="fgb-label text-[var(--red)]" style={{ fontSize: 10 }}>Gestão</span>
            <span className="fgb-badge fgb-badge-red">INSCRIÇÕES</span>
          </div>
          <h1 className="fgb-display text-3xl text-[var(--black)]">Central de Inscrições</h1>
          <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Todas as inscrições de equipes em campeonatos da federação
          </p>
        </div>
        <Link href="/admin/championships" className="fgb-badge fgb-badge-red hover:opacity-80 cursor-pointer self-start md:self-auto">
          Gerenciar por Campeonato →
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Confirmadas', count: totalConfirmed, border: 'border-t-[var(--verde)]',  text: 'text-[var(--verde)]' },
          { label: 'Pendentes',   count: totalPending,   border: 'border-t-[var(--yellow)]', text: 'text-[var(--black)]' },
          { label: 'Recusadas',   count: totalRejected,  border: 'border-t-[var(--red)]',    text: 'text-[var(--red)]' },
        ].map(item => (
          <div key={item.label} className={`fgb-card bg-white p-6 border-t-[3px] ${item.border}`}>
            <p className={`fgb-display text-4xl leading-none ${item.text}`}>{item.count}</p>
            <p className="fgb-label text-[var(--gray)] mt-2" style={{ fontSize: 9 }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* List by championship */}
      {Object.keys(byChampionship).length === 0 ? (
        <div className="fgb-card bg-white p-20 text-center">
          <Users className="w-12 h-12 text-[var(--gray)] mx-auto mb-4 opacity-30" />
          <h3 className="fgb-display text-lg text-[var(--black)] mb-2">Nenhuma inscrição registrada</h3>
          <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
            As inscrições aparecerão aqui quando as equipes começarem a se inscrever.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.values(byChampionship).map(({ championship, items }) => {
            const champStatusLabels: Record<string, string> = {
              REGISTRATION_OPEN:   'Inscrições Abertas',
              REGISTRATION_CLOSED: 'Inscrições Encerradas',
              ONGOING:             'Em Andamento',
              FINISHED:            'Encerrado',
              DRAFT:               'Rascunho',
            }
            const confirmedHere = items.filter(i => i.status === 'CONFIRMED').length
            const pendingHere   = items.filter(i => i.status === 'PENDING').length

            return (
              <div key={championship.id} className="fgb-card bg-white overflow-hidden">
                {/* Championship header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-4 h-4 text-[var(--verde)]" />
                    <div>
                      <h2 className="fgb-display text-sm text-[var(--black)] leading-none">{championship.name}</h2>
                      <p className="fgb-label text-[var(--gray)] mt-0.5" style={{ fontSize: 9 }}>
                        {championship.year} · {champStatusLabels[championship.status] ?? championship.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>
                      {confirmedHere} confirmadas · {pendingHere} pendentes
                    </span>
                    <Link
                      href={`/admin/championships/${championship.id}/registrations`}
                      className="fgb-label text-[var(--verde)] hover:text-[var(--black)] flex items-center gap-1 transition-colors"
                      style={{ fontSize: 9 }}
                    >
                      Gerenciar <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Registrations list */}
                <div className="divide-y divide-[var(--border)]">
                  {items.map(reg => {
                    const cfg = STATUS_CONFIG[reg.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING
                    const Icon = cfg.icon
                    return (
                      <div key={reg.id} className="flex items-center gap-4 px-6 py-4 hover:bg-[var(--gray-l)]/50 transition-colors">
                        {/* Team logo */}
                        <div className="w-9 h-9 rounded-xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                          {reg.team.logoUrl ? (
                            <img src={reg.team.logoUrl} className="w-full h-full rounded-xl object-cover p-0.5" alt={reg.team.name} />
                          ) : (
                            <span className="fgb-display text-sm text-[var(--gray)]">{reg.team.name.charAt(0)}</span>
                          )}
                        </div>

                        {/* Team info */}
                        <div className="flex-1 min-w-0">
                          <p className="fgb-display text-sm text-[var(--black)] leading-none truncate">{reg.team.name}</p>
                          {reg.team.city && (
                            <p className="fgb-label text-[var(--gray)] mt-0.5 truncate" style={{ fontSize: 9, textTransform: 'none', letterSpacing: 0 }}>
                              {reg.team.city}
                            </p>
                          )}
                        </div>

                        {/* Categories */}
                        <div className="hidden md:flex flex-wrap gap-1 max-w-[200px]">
                          {reg.categories.map((rc: any) => (
                            <span key={rc.category.id} className="inline-flex items-center gap-1 bg-[var(--gray-l)] border border-[var(--border)] px-2 py-0.5 rounded-full fgb-label" style={{ fontSize: 8 }}>
                              <Tag className="w-2 h-2 text-[var(--gray)]" />
                              {rc.category.name}
                            </span>
                          ))}
                        </div>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 fgb-label px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.badge}`} style={{ fontSize: 9 }}>
                          <Icon className={`w-3 h-3 ${cfg.iconColor}`} />
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
