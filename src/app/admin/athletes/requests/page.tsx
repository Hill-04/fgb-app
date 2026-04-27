import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'

import { AthleteCbbStatusBadge, AthleteRequestStatusBadge } from '@/components/athletes/status-badges'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  formatAthleteDate,
  isPendingAthleteRequestStatus,
  sortAthleteRequestsByStatus,
} from '@/lib/athlete-registration-presentation'

export const dynamic = 'force-dynamic'

export default async function AdminAthleteRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) redirect('/login')

  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search.trim() : ''
  const status = typeof params.status === 'string' ? params.status.trim() : ''
  const teamId = typeof params.teamId === 'string' ? params.teamId.trim() : ''
  const cbbCheckStatus = typeof params.cbbCheckStatus === 'string' ? params.cbbCheckStatus.trim() : ''

  const where: Prisma.AthleteRegistrationRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(teamId ? { teamId } : {}),
    ...(cbbCheckStatus ? { cbbCheckStatus } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { documentNumber: { contains: search } },
            { team: { name: { contains: search } } },
          ],
        }
      : {}),
  }

  const [requests, teams] = await Promise.all([
    prisma.athleteRegistrationRequest.findMany({
      where,
      include: { team: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])
  const sortedRequests = sortAthleteRequestsByStatus(requests)

  return (
    <div className="space-y-8">
      <div>
        <p className="fgb-label text-[var(--red)]" style={{ fontSize: 10 }}>Painel operacional</p>
        <h1 className="fgb-display mt-2 text-3xl leading-none text-[var(--black)]">Solicitacoes de atletas</h1>
      </div>

      <form className="grid gap-3 rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm md:grid-cols-4">
        <input
          name="search"
          defaultValue={search}
          placeholder="Buscar por atleta, documento ou equipe"
          className="h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--verde)] md:col-span-2"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--verde)]"
        >
          <option value="">Todos os status</option>
          <option value="DRAFT">Rascunho</option>
          <option value="SUBMITTED">Enviada</option>
          <option value="UNDER_REVIEW">Em analise</option>
          <option value="CBB_CHECK_PENDING">CBB pendente</option>
          <option value="CBB_CHECKED">CBB conferida</option>
          <option value="APPROVED">Aprovada</option>
          <option value="REJECTED">Rejeitada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <select
          name="teamId"
          defaultValue={teamId}
          className="h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--verde)]"
        >
          <option value="">Todas as equipes</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <select
          name="cbbCheckStatus"
          defaultValue={cbbCheckStatus}
          className="h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm outline-none focus:border-[var(--verde)]"
        >
          <option value="">Toda a CBB</option>
          <option value="PENDING">CBB pendente</option>
          <option value="CHECKED">CBB conferida</option>
        </select>
        <div className="flex items-center gap-3 md:col-span-4">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#0f4627]"
          >
            Aplicar filtros
          </button>
          <Link
            href="/admin/athletes/requests"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] transition-all hover:text-[var(--black)]"
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="space-y-4">
        {sortedRequests.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-white p-14 text-center text-sm text-[var(--gray)]">
            Nenhuma solicitacao registrada.
          </div>
        ) : (
          sortedRequests.map((request) => (
            <Link
              key={request.id}
              href={`/admin/athletes/requests/${request.id}`}
              className={`block rounded-[28px] border bg-white p-6 shadow-sm transition-all hover:border-[var(--verde)] ${
                isPendingAthleteRequestStatus(request.status) ? 'border-[var(--yellow)]/40' : 'border-[var(--border)]'
              }`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black uppercase text-[var(--black)]">{request.fullName}</p>
                  <p className="mt-2 text-[11px] font-medium text-[var(--gray)]">
                    {request.team.name} | {request.requestedCategoryLabel || 'Categoria não informada'} | Documento {request.documentNumber}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--gray)]">
                    Criada em {formatAthleteDate(request.createdAt)} | Conferência CBB {request.cbbReference || 'sem referência'}
                  </p>
                  {isPendingAthleteRequestStatus(request.status) ? (
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--black)]">
                      Prioridade de análise
                    </p>
                  ) : null}
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
