import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ChevronLeft } from 'lucide-react'

import { AdminAthleteRequestActions } from '@/components/athletes/admin-athlete-request-actions'
import { AthleteRequestAuditTimeline } from '@/components/athletes/athlete-request-audit-timeline'
import { AthleteCbbStatusBadge, AthleteFederationStatusBadge, AthleteRequestStatusBadge } from '@/components/athletes/status-badges'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatAthleteDate } from '@/lib/athlete-registration-presentation'

export const dynamic = 'force-dynamic'

export default async function AdminAthleteRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) redirect('/login')

  const { id } = await params
  const athleteRequest = await prisma.athleteRegistrationRequest.findUnique({
    where: { id },
    include: {
      team: { select: { id: true, name: true } },
      athlete: true,
      auditLogs: {
        include: {
          createdByUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      cbbCheckedByUser: { select: { id: true, name: true } },
      reviewedByUser: { select: { id: true, name: true } },
      approvedByUser: { select: { id: true, name: true } },
    },
  })

  if (!athleteRequest) notFound()

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/athletes/requests"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para solicitacoes
        </Link>
        <p className="fgb-label mt-4 text-[var(--red)]" style={{ fontSize: 10 }}>Analise federativa</p>
        <h1 className="fgb-display mt-2 text-3xl leading-none text-[var(--black)]">{athleteRequest.fullName}</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <AthleteRequestStatusBadge status={athleteRequest.status} />
              <AthleteCbbStatusBadge status={athleteRequest.cbbCheckStatus} />
              {athleteRequest.athlete ? <AthleteFederationStatusBadge status={athleteRequest.athlete.status} /> : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Equipe solicitante</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.team.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Categoria</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.requestedCategoryLabel || 'Não informada'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Nascimento</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{formatAthleteDate(athleteRequest.birthDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Documento</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.documentNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Nome da mãe</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.motherName || 'Não informada'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Contato</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">
                  {athleteRequest.phone || 'Sem telefone'}{athleteRequest.email ? ` | ${athleteRequest.email}` : ''}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Registro CBB</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.cbbRegistrationNumber || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Referencia CBB</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.cbbReference || 'Não informada'}</p>
              </div>
            </div>

            {athleteRequest.cbbNotes ? (
              <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-700">Observacoes CBB</p>
                <p className="mt-2 text-sm font-medium text-yellow-900">{athleteRequest.cbbNotes}</p>
              </div>
            ) : null}

            {athleteRequest.rejectionReason ? (
              <div className="mt-6 rounded-2xl border border-[var(--red)]/20 bg-[var(--red)]/10 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--red)]">Motivo da rejeicao</p>
                <p className="mt-2 text-sm font-medium text-[var(--red)]">{athleteRequest.rejectionReason}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Auditoria</p>
            <div className="mt-4">
              <AthleteRequestAuditTimeline items={athleteRequest.auditLogs} />
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Linha do tempo</p>
            <div className="mt-4 space-y-2 text-sm text-[var(--gray)]">
              <p>Criada em {formatAthleteDate(athleteRequest.createdAt)}</p>
              {athleteRequest.submittedAt ? <p>Enviada em {formatAthleteDate(athleteRequest.submittedAt)}</p> : null}
              {athleteRequest.reviewedAt ? <p>Revisada em {formatAthleteDate(athleteRequest.reviewedAt)}{athleteRequest.reviewedByUser ? ` | ${athleteRequest.reviewedByUser.name}` : ''}</p> : null}
              {athleteRequest.cbbCheckedAt ? <p>CBB em {formatAthleteDate(athleteRequest.cbbCheckedAt)}{athleteRequest.cbbCheckedByUser ? ` | ${athleteRequest.cbbCheckedByUser.name}` : ''}</p> : null}
              {athleteRequest.approvedAt ? <p>Aprovada em {formatAthleteDate(athleteRequest.approvedAt)}{athleteRequest.approvedByUser ? ` | ${athleteRequest.approvedByUser.name}` : ''}</p> : null}
              {athleteRequest.athlete ? <p className="font-bold text-[var(--black)]">Atleta vinculado: {athleteRequest.athlete.name}</p> : null}
            </div>
          </div>

          <AdminAthleteRequestActions
            requestId={athleteRequest.id}
            initialCbbCheckStatus={athleteRequest.cbbCheckStatus}
            initialCbbNotes={athleteRequest.cbbNotes}
            initialCbbReference={athleteRequest.cbbReference}
            initialCbbDocumentMatch={athleteRequest.cbbDocumentMatch ?? false}
            initialCbbNameMatch={athleteRequest.cbbNameMatch ?? false}
            initialCbbBirthDateMatch={athleteRequest.cbbBirthDateMatch ?? false}
            currentStatus={athleteRequest.status}
          />
        </aside>
      </div>
    </div>
  )
}
