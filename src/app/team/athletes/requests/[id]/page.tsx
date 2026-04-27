import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { ChevronLeft, Shield } from 'lucide-react'

import { AthleteRequestAuditTimeline } from '@/components/athletes/athlete-request-audit-timeline'
import { AthleteCbbStatusBadge, AthleteFederationStatusBadge, AthleteRequestStatusBadge } from '@/components/athletes/status-badges'
import { TeamAthleteRequestCancelButton } from '@/components/athletes/team-athlete-request-cancel-button'
import { TeamAthleteRequestForm } from '@/components/athletes/team-athlete-request-form'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canTeamCancelAthleteRequest } from '@/lib/athlete-registration'
import { formatAthleteDate } from '@/lib/athlete-registration-presentation'

export const dynamic = 'force-dynamic'

export default async function TeamAthleteRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') redirect('/login')

  const teamId = (session.user as any).teamId
  if (!teamId) redirect('/team/onboarding')

  const { id } = await params
  const athleteRequest = await prisma.athleteRegistrationRequest.findFirst({
    where: { id, teamId },
    include: {
      athlete: true,
      auditLogs: {
        include: {
          createdByUser: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!athleteRequest) notFound()

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/team/athletes/requests"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar para solicitacoes
        </Link>
        <p className="fgb-label mt-4 text-[var(--verde)]" style={{ fontSize: 10 }}>Detalhe da solicitacao</p>
        <h1 className="fgb-display mt-2 text-3xl leading-none text-[var(--black)]">{athleteRequest.fullName}</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <AthleteRequestStatusBadge status={athleteRequest.status} />
              <AthleteCbbStatusBadge status={athleteRequest.cbbCheckStatus} />
              {athleteRequest.athlete ? <AthleteFederationStatusBadge status={athleteRequest.athlete.status} /> : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Documento</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.documentNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Nascimento</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{formatAthleteDate(athleteRequest.birthDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Categoria</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.requestedCategoryLabel || 'Não informada'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">CBB</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.cbbRegistrationNumber || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Mae</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">{athleteRequest.motherName || 'Não informada'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Contato</p>
                <p className="mt-1 text-sm font-bold text-[var(--black)]">
                  {athleteRequest.phone || 'Sem telefone'}{athleteRequest.email ? ` | ${athleteRequest.email}` : ''}
                </p>
              </div>
            </div>

            {athleteRequest.rejectionReason ? (
              <div className="mt-6 rounded-2xl border border-[var(--red)]/20 bg-[var(--red)]/10 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--red)]">Motivo da rejeicao</p>
                <p className="mt-2 text-sm font-medium text-[var(--red)]">{athleteRequest.rejectionReason}</p>
              </div>
            ) : null}
          </div>

          {athleteRequest.status === 'DRAFT' ? (
            <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Editar rascunho</p>
              <div className="mt-5">
                <TeamAthleteRequestForm
                  initialData={{
                    id: athleteRequest.id,
                    fullName: athleteRequest.fullName,
                    birthDate: athleteRequest.birthDate.toISOString().slice(0, 10),
                    documentNumber: athleteRequest.documentNumber,
                    motherName: athleteRequest.motherName,
                    phone: athleteRequest.phone,
                    email: athleteRequest.email,
                    requestedCategoryLabel: athleteRequest.requestedCategoryLabel,
                    cbbRegistrationNumber: athleteRequest.cbbRegistrationNumber,
                    status: athleteRequest.status,
                  }}
                />
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--verde)]/10 text-[var(--verde)]">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Acompanhamento</p>
                <h2 className="fgb-display text-xl leading-none text-[var(--black)]">Estado atual</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-[var(--gray)]">
              <p>Criada em {formatAthleteDate(athleteRequest.createdAt)}</p>
              {athleteRequest.submittedAt ? <p>Enviada em {formatAthleteDate(athleteRequest.submittedAt)}</p> : null}
              {athleteRequest.cbbCheckedAt ? <p>Conferencia CBB em {formatAthleteDate(athleteRequest.cbbCheckedAt)}</p> : null}
              {athleteRequest.approvedAt ? <p>Aprovada em {formatAthleteDate(athleteRequest.approvedAt)}</p> : null}
              {athleteRequest.athlete ? (
                <p className="font-bold text-[var(--black)]">Atleta federativo criado e vinculado a esta equipe.</p>
              ) : null}
            </div>
            {canTeamCancelAthleteRequest(athleteRequest) ? (
              <div className="mt-5">
                <TeamAthleteRequestCancelButton requestId={athleteRequest.id} />
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Historico</p>
            <div className="mt-4">
              <AthleteRequestAuditTimeline items={athleteRequest.auditLogs} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
