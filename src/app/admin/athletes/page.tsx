import { randomUUID } from 'crypto'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { CheckCircle2, ClipboardList, Shield, User as UserIcon, Users } from 'lucide-react'

import { AthleteFederationStatusBadge, AthleteRequestStatusBadge } from '@/components/athletes/status-badges'
import { prisma } from '@/lib/db'
import { isPendingAthleteRequestStatus, sortAthleteRequestsByStatus } from '@/lib/athlete-registration-presentation'
import { requireAdminSession } from '@/lib/athlete-registration-server'

export const dynamic = 'force-dynamic'

const POSITIONS = [
  { value: 'PG', label: 'PG - Armador' },
  { value: 'SG', label: 'SG - Ala-armador' },
  { value: 'SF', label: 'SF - Ala' },
  { value: 'PF', label: 'PF - Ala-pivo' },
  { value: 'C', label: 'C - Pivo' },
  { value: 'COACH', label: 'Tecnico' },
]

async function createAthlete(formData: FormData) {
  'use server'
  if (!await requireAdminSession()) return
  const name = String(formData.get('name') || '').trim()
  const document = String(formData.get('document') || '').trim()
  const teamId = String(formData.get('teamId') || '').trim()
  const position = String(formData.get('position') || '').trim()
  const jerseyRaw = formData.get('jerseyNumber')
  const sex = String(formData.get('sex') || '').trim()
  const birthDate = String(formData.get('birthDate') || '').trim()
  const photoUrl = String(formData.get('photoUrl') || '').trim()

  if (!name) return

  await prisma.athlete.create({
    data: {
      name,
      document: document || null,
      teamId: teamId || null,
      position: position || null,
      jerseyNumber: jerseyRaw ? Number(jerseyRaw) : null,
      sex: sex || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      photoUrl: photoUrl || null,
    },
  })

  revalidatePath('/admin/athletes')
}

async function issueCard(formData: FormData) {
  'use server'
  if (!await requireAdminSession()) return
  const athleteId = String(formData.get('athleteId') || '').trim()
  if (!athleteId) return

  await prisma.athleteIdCard.create({
    data: {
      athleteId,
      qrToken: randomUUID(),
      cardNumber: `FGB-${Date.now().toString(36).toUpperCase()}`,
    },
  })

  revalidatePath('/admin/athletes')
}

const inputCls =
  'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm w-full focus:outline-none focus:border-[var(--verde)]'

export default async function AdminAthletesPage() {
  const [athletes, teams, requests, athleteStatusSummary, requestStatusSummary] = await Promise.all([
    prisma.athlete.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        team: true,
        cards: { orderBy: { createdAt: 'desc' }, take: 1 },
        registrationRequests: {
          where: { status: 'APPROVED' },
          orderBy: { approvedAt: 'desc' },
          take: 1,
          select: { requestedCategoryLabel: true },
        },
      },
      take: 30,
    }),
    prisma.team.findMany({ orderBy: { name: 'asc' } }),
    prisma.athleteRegistrationRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { team: { select: { id: true, name: true } } },
      take: 8,
    }),
    prisma.athlete.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.athleteRegistrationRequest.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  const countBy = (rows: Array<{ status: string; _count: { _all: number } }>, status: string) =>
    rows.find((row) => row.status === status)?._count._all || 0
  const sortedRequests = sortAthleteRequestsByStatus(requests)

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>BID Federativo</p>
          <h1 className="fgb-display mt-2 text-3xl text-[var(--black)]">Atletas e Solicitacoes</h1>
          <p className="mt-2 text-sm font-medium text-[var(--gray)]">
            Operacao central do registro federativo: atletas ativos, solicitacoes pendentes e cadastro manual legado.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/athletes/requests"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition-all hover:border-[var(--verde)]"
          >
            Abrir solicitacoes
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Ativos</p>
          <p className="fgb-display mt-3 text-4xl leading-none text-[var(--black)]">{countBy(athleteStatusSummary, 'ACTIVE')}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Inativos</p>
          <p className="fgb-display mt-3 text-4xl leading-none text-[var(--black)]">{countBy(athleteStatusSummary, 'INACTIVE')}</p>
        </div>
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Pendentes</p>
          <p className="fgb-display mt-3 text-4xl leading-none text-[var(--black)]">
            {countBy(requestStatusSummary, 'SUBMITTED') +
              countBy(requestStatusSummary, 'UNDER_REVIEW') +
              countBy(requestStatusSummary, 'CBB_CHECK_PENDING') +
              countBy(requestStatusSummary, 'CBB_CHECKED')}
          </p>
        </div>
        <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Aprovados</p>
          <p className="fgb-display mt-3 text-4xl leading-none text-[var(--black)]">{countBy(requestStatusSummary, 'APPROVED')}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--yellow)]/25 text-[var(--black)]">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Fila operacional</p>
                <h2 className="fgb-display text-xl leading-none text-[var(--black)]">Solicitacoes recentes</h2>
              </div>
            </div>
            <div className="space-y-3">
              {sortedRequests.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--gray)]">
                  Nenhuma solicitacao registrada.
                </p>
              ) : (
                sortedRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/admin/athletes/requests/${request.id}`}
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
                          {request.team.name} | {request.requestedCategoryLabel || 'Categoria não informada'}
                        </p>
                        {isPendingAthleteRequestStatus(request.status) ? (
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[var(--black)]">
                            Pendência operacional
                          </p>
                        ) : null}
                      </div>
                      <AthleteRequestStatusBadge status={request.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Cadastro manual legado</p>
            <h2 className="fgb-display mt-2 text-xl leading-none text-[var(--black)]">Criar atleta direto</h2>
            <p className="mt-2 text-sm text-[var(--gray)]">
              Mantido nesta sprint para nao quebrar o fluxo atual de operacao da federacao.
            </p>
            <form action={createAthlete} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input name="name" placeholder="Nome completo *" required className={inputCls} />
              <input name="document" placeholder="CPF / RG" className={inputCls} />
              <select name="teamId" defaultValue="" className={inputCls}>
                <option value="">Sem equipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <select name="position" defaultValue="" className={inputCls}>
                <option value="">Posicao</option>
                {POSITIONS.map((position) => (
                  <option key={position.value} value={position.value}>
                    {position.label}
                  </option>
                ))}
              </select>
              <input name="jerseyNumber" type="number" min={0} max={99} placeholder="Nº camisa" className={inputCls} />
              <select name="sex" defaultValue="" className={inputCls}>
                <option value="">Sexo</option>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
              <input name="birthDate" type="date" className={inputCls} />
              <input name="photoUrl" placeholder="URL da foto" className={`${inputCls} sm:col-span-2`} />
              <button type="submit" className="fgb-btn-primary h-10 rounded-xl sm:col-span-2 lg:col-span-3">
                Cadastrar atleta
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--verde)]/10 text-[var(--verde)]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Base federativa</p>
              <h2 className="fgb-display text-xl leading-none text-[var(--black)]">Atletas aprovados</h2>
            </div>
          </div>
          <div className="space-y-3">
            {athletes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--gray)]">
                Nenhum atleta federado encontrado.
              </p>
            ) : (
              athletes.map((athlete) => (
                <div key={athlete.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white">
                      {athlete.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={athlete.photoUrl} alt={athlete.name} className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        <UserIcon className="h-5 w-5 text-[var(--gray)]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase text-[var(--black)]">{athlete.name}</p>
                      <p className="mt-1 text-[10px] text-[var(--gray)]">
                        {athlete.team?.name || 'Sem equipe'} | {athlete.registrationRequests[0]?.requestedCategoryLabel || 'Sem categoria'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AthleteFederationStatusBadge status={athlete.status} />
                    {athlete.cards[0] ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--verde)]/20 bg-[var(--verde)]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--verde)]">
                        <CheckCircle2 className="h-3 w-3" />
                        Carteira ativa
                      </span>
                    ) : (
                      <form action={issueCard}>
                        <input type="hidden" name="athleteId" value={athlete.id} />
                        <button type="submit" className="inline-flex h-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-[10px] font-black uppercase tracking-widest text-[var(--black)]">
                          Gerar carteirinha
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
