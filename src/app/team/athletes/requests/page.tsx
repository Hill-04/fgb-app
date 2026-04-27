import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

import { AthleteCbbStatusBadge, AthleteRequestStatusBadge } from '@/components/athletes/status-badges'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { formatAthleteDate } from '@/lib/athlete-registration-presentation'

export const dynamic = 'force-dynamic'

export default async function TeamAthleteRequestsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') redirect('/login')

  const teamId = (session.user as any).teamId
  if (!teamId) redirect('/team/onboarding')

  const requests = await prisma.athleteRegistrationRequest.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>Historico de solicitacoes</p>
          <h1 className="fgb-display mt-2 text-3xl leading-none text-[var(--black)]">Solicitacoes de atletas</h1>
        </div>
        <Link
          href="/team/athletes/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#0f4627]"
        >
          Nova solicitacao
        </Link>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-white p-14 text-center text-sm text-[var(--gray)]">
            Nenhuma solicitacao cadastrada.
          </div>
        ) : (
          requests.map((request) => (
            <Link
              key={request.id}
              href={`/team/athletes/requests/${request.id}`}
              className="block rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm transition-all hover:border-[var(--verde)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black uppercase text-[var(--black)]">{request.fullName}</p>
                  <p className="mt-2 text-[11px] font-medium text-[var(--gray)]">
                    {request.requestedCategoryLabel || 'Categoria nao informada'} | Documento {request.documentNumber}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--gray)]">
                    Criada em {formatAthleteDate(request.createdAt)}{request.rejectionReason ? ` | Motivo: ${request.rejectionReason}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <AthleteRequestStatusBadge status={request.status} />
                  <AthleteCbbStatusBadge status={request.cbbCheckStatus} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
