import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { FileClock, Plus } from 'lucide-react'

import { AthleteRequestStatusBadge } from '@/components/athletes/status-badges'
import type { DrawerAthlete } from '@/components/AthleteDrawer'
import { TeamPageHeader } from '@/components/team/team-page-header'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isPendingAthleteRequestStatus, sortAthleteRequestsByStatus } from '@/lib/athlete-registration-presentation'
import { TeamAthletesListClient } from './TeamAthletesListClient'

export const dynamic = 'force-dynamic'

export default async function TeamAthletesPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'TEAM') redirect('/login')

  const teamId = (session.user as any).teamId
  if (!teamId) redirect('/team/onboarding')

  const [athletesRaw, requests] = await Promise.all([
    prisma.athlete.findMany({
      where: { teamId },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      include: {
        registrationRequests: {
          where: { status: 'APPROVED' },
          orderBy: { approvedAt: 'desc' },
          take: 1,
          select: { requestedCategoryLabel: true },
        },
      },
    }),
    prisma.athleteRegistrationRequest.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        fullName: true,
        status: true,
        requestedCategoryLabel: true,
        createdAt: true,
      },
    }),
  ])

  const athletes: DrawerAthlete[] = athletesRaw.map((a) => ({
    id: a.id,
    name: a.name,
    photoUrl: a.photoUrl,
    status: a.status,
    federationStatus: a.federationStatus,
    situation: a.situation,
    registrationNumber: a.registrationNumber,
    registrationCBB: a.registrationCBB,
    registrationPrev: a.registrationPrev,
    filiationDate: a.filiationDate,
    birthDate: a.birthDate,
    birthCity: a.birthCity,
    sex: a.sex,
    nationality: a.nationality,
    maritalStatus: a.maritalStatus,
    education: a.education,
    position: a.position,
    jerseyNumber: a.jerseyNumber,
    height: a.height,
    weight: a.weight,
    document: a.document,
    cpf: a.cpf,
    rg: a.rg,
    rgOrgan: a.rgOrgan,
    rgDate: a.rgDate,
    email: (a as any).email ?? null,
    mobile: a.mobile,
    phone: a.phone,
    cep: a.cep,
    state: a.state,
    city: a.city,
    address: a.address,
    addressNum: a.addressNum,
    addressComp: a.addressComp,
    motherName: a.motherName,
    fatherName: a.fatherName,
    notes: a.notes,
    docCPFUrl: a.docCPFUrl,
    docRGFrontUrl: a.docRGFrontUrl,
    docRGBackUrl: a.docRGBackUrl,
    docBirthCertUrl: a.docBirthCertUrl,
    docOtherUrl: a.docOtherUrl,
    category: a.registrationRequests[0]?.requestedCategoryLabel ?? null,
  }))

  const sortedRequests = sortAthleteRequestsByStatus(requests)

  return (
    <div className="space-y-8">
      <TeamPageHeader
        eyebrow="BID Federativo"
        eyebrowTone="green"
        title="Atletas da Equipe"
        description="Consulte atletas ativos e acompanhe novas solicitacoes de registro federativo."
        actions={
          <>
            <Link
              href="/team/athletes/requests"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:border-[var(--verde)]"
            >
              Ver solicitacoes
            </Link>
            <Link
              href="/team/athletes/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#0f4627]"
            >
              <Plus className="h-4 w-4" />
              Novo cadastro
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Atletas cadastrados</p>
          <p className="fgb-display mt-3 text-4xl leading-none text-[var(--black)]">{athletes.length}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Solicitacoes recentes</p>
          <p className="fgb-display mt-3 text-4xl leading-none text-[var(--black)]">{requests.length}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Pendentes de resposta</p>
          <p className="fgb-display mt-3 text-4xl leading-none text-[var(--black)]">
            {requests.filter((request) => !['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status)).length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section>
          <TeamAthletesListClient athletes={athletes} />
        </section>

        <aside className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--yellow)]/25 text-[var(--black)]">
              <FileClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Fluxo atual</p>
              <h2 className="fgb-display text-xl leading-none text-[var(--black)]">Solicitacoes recentes</h2>
            </div>
          </div>
          <div className="space-y-3">
            {sortedRequests.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--gray)]">
                Nenhuma solicitacao criada ainda.
              </p>
            ) : (
              sortedRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/team/athletes/requests/${request.id}`}
                  className={`block rounded-2xl border px-4 py-3 transition-all hover:border-[var(--verde)] ${
                    isPendingAthleteRequestStatus(request.status)
                      ? 'border-[var(--yellow)]/35 bg-[var(--yellow)]/10'
                      : 'border-[var(--border)] bg-[var(--gray-l)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black uppercase text-[var(--black)]">{request.fullName}</p>
                      <p className="mt-1 text-[10px] text-[var(--gray)]">
                        {request.requestedCategoryLabel || 'Categoria não informada'} |{' '}
                        {new Date(request.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      {isPendingAthleteRequestStatus(request.status) ? (
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--black)]">
                          Aguardando retorno da federação
                        </p>
                      ) : null}
                    </div>
                    <AthleteRequestStatusBadge status={request.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            href="/team/athletes/requests"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:border-[var(--verde)]"
          >
            Abrir lista completa
          </Link>
        </aside>
      </div>
    </div>
  )
}
