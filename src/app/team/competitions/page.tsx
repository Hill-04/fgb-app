import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Award, Trophy, Check, ExternalLink } from 'lucide-react'
import { TeamCompetitionsClient } from './TeamCompetitionsClient'

export const dynamic = 'force-dynamic'

export default async function TeamCompetitionsPage() {
  await ensureDatabaseSchema()
  const session = await getServerSession(authOptions)
  const teamId = (session?.user as any)?.teamId as string | undefined

  if (!teamId) redirect('/team/dashboard')

  const fmtDate = (d: Date | null | undefined) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const [fgbChamps, externals, myRegistrations, myDeclarations, myAthletes] = await Promise.all([
    prisma.championship.findMany({
      where: { isSimulation: false, status: { in: ['REGISTRATION_OPEN', 'ONGOING', 'DRAFT'] } },
      orderBy: { startDate: 'asc' },
      include: { categories: { select: { id: true, name: true } } },
    }).catch(() => []),
    prisma.externalCompetition.findMany({
      where: { isPublished: true },
      orderBy: { startDate: 'asc' },
      include: {
        blocks: { include: { championship: { select: { id: true, name: true } } } },
      },
    }).catch(() => []),
    prisma.registration.findMany({
      where: { teamId },
      select: { id: true, championshipId: true, status: true },
    }).catch(() => []),
    prisma.externalRegistration.findMany({
      where: { teamId, status: { not: 'WITHDRAWN' } },
      select: { id: true, externalCompetitionId: true, athleteId: true },
    }).catch(() => []),
    prisma.athlete.findMany({
      where: { teamId },
      select: { id: true, name: true, sex: true, birthDate: true },
      orderBy: { name: 'asc' },
    }).catch(() => []),
  ])

  const blocks = await prisma.fGBRegistrationBlock.findMany({
    where: { teamId, isActive: true },
    include: {
      championship: { select: { id: true, name: true } },
      externalRegistration: {
        include: { externalCompetition: { select: { name: true } } },
      },
    },
  }).catch(() => [])

  const blockedChampionshipIds = new Set(blocks.map((b) => b.championshipId))

  const declaredCountByExternal = new Map<string, number>()
  for (const d of myDeclarations) {
    declaredCountByExternal.set(
      d.externalCompetitionId,
      (declaredCountByExternal.get(d.externalCompetitionId) ?? 0) + 1,
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="fgb-display text-[28px] text-[var(--black)] flex items-center gap-2">
          <Trophy className="text-[var(--verde)]" size={26} />
          Competições 2026
        </h1>
        <p className="fgb-label text-[var(--gray)] mt-2" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Escolha onde sua equipe vai competir nesta temporada.
        </p>
      </div>

      {/* SEÇÃO 1 — FGB */}
      <section
        className="rounded-lg p-6 space-y-4"
        style={{ background: 'rgba(20,85,48,0.04)', border: '2px solid rgba(20,85,48,0.15)' }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="fgb-badge" style={{ background: '#F5C200', color: '#000', fontWeight: 800 }}>
              OFICIAL FGB
            </span>
            <h2 className="fgb-display text-[22px] text-[var(--verde)] mt-2 flex items-center gap-2">
              <Award size={22} />
              Competições da Federação Gaúcha de Basquete
            </h2>
            <p className="text-sm text-[var(--gray)] mt-1">
              Visibilidade estadual · Calendário profissional · Certificação CBB · Ranqueamento oficial
            </p>
          </div>
        </div>

        {fgbChamps.length === 0 ? (
          <div className="fgb-card p-6 text-center text-[var(--gray)]">
            Nenhum campeonato FGB aberto no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fgbChamps.map((c) => {
              const myReg = myRegistrations.find((r) => r.championshipId === c.id)
              const isBlocked = blockedChampionshipIds.has(c.id)
              const championshipBlocks = blocks.filter((b) => b.championshipId === c.id)
              return (
                <div
                  key={c.id}
                  className="fgb-card p-5"
                  style={{ borderLeft: '4px solid var(--verde)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="fgb-display text-[18px] flex items-center gap-2">
                      <Trophy size={16} className="text-[var(--verde)]" />
                      {c.name}
                    </h3>
                    {myReg ? (
                      <span className="fgb-badge fgb-badge-verde flex items-center gap-1">
                        <Check size={12} /> Inscrita
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-[var(--gray)] mb-2">
                    {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.categories.slice(0, 5).map((cat) => (
                      <span key={cat.id} className="fgb-badge fgb-badge-outline text-[10px]">
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <ul className="text-xs space-y-1 mb-3">
                    <li className="flex items-center gap-1 text-[var(--verde)]"><Check size={12} /> Ranqueamento estadual oficial</li>
                    <li className="flex items-center gap-1 text-[var(--verde)]"><Check size={12} /> Visibilidade para scouts e seleções</li>
                    <li className="flex items-center gap-1 text-[var(--verde)]"><Check size={12} /> Emissão de documentos CBB</li>
                  </ul>
                  {isBlocked && (
                    <div className="text-xs p-2 rounded mb-3" style={{ background: 'rgba(204,16,22,0.08)', color: 'var(--red)' }}>
                      ⚠️ Há {championshipBlocks.length} atleta(s) bloqueada(s) por declaração em competição externa.
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--gray)]">
                      Status: {c.status === 'REGISTRATION_OPEN' ? 'Inscrições abertas' : c.status}
                    </span>
                    <Link
                      href={`/team/registrations`}
                      className="fgb-btn-primary text-xs"
                    >
                      {myReg ? 'Ver Inscrição' : 'Inscrever'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* DIVIDER de exclusividade */}
      <div
        className="rounded-lg p-5 flex items-start gap-3"
        style={{ background: 'rgba(245,194,0,0.1)', borderLeft: '5px solid #F5C200' }}
      >
        <AlertTriangle size={28} style={{ color: '#CC7A00' }} className="flex-shrink-0" />
        <div>
          <h3 className="fgb-display text-[16px] text-[var(--black)] mb-1">
            ⚠️ ATENÇÃO — EXCLUSIVIDADE DE INSCRIÇÃO
          </h3>
          <p className="text-sm text-[var(--black)]">
            As competições abaixo são organizadas por terceiros. A inscrição nessas competições
            <strong> BLOQUEIA</strong> a participação nos campeonatos da FGB listados acima.
            Escolha com atenção.
          </p>
        </div>
      </div>

      {/* SEÇÃO 2 — Externas */}
      <section className="space-y-4">
        <h2 className="fgb-display text-[18px] text-[var(--black)]">
          Competições de Terceiros — Temporada 2026
        </h2>

        {externals.length === 0 ? (
          <div className="fgb-card p-6 text-center text-[var(--gray)]">
            Nenhuma competição externa cadastrada.
          </div>
        ) : (
          <TeamCompetitionsClient
            externals={externals.map((e) => ({
              id: e.id,
              name: e.name,
              organizer: e.organizer,
              city: e.city,
              state: e.state,
              startDate: e.startDate.toISOString(),
              endDate: e.endDate.toISOString(),
              websiteUrl: e.websiteUrl,
              categories: (() => {
                try { return JSON.parse(e.categoriesJson) } catch { return [] }
              })(),
              blocks: e.blocks.map((b) => ({
                championshipId: b.championshipId,
                championshipName: b.championship.name,
              })),
              declaredCount: declaredCountByExternal.get(e.id) ?? 0,
            }))}
            athletes={myAthletes.map((a) => ({
              id: a.id,
              name: a.name,
              sex: a.sex,
              birthDate: a.birthDate?.toISOString() ?? null,
            }))}
            teamId={teamId}
          />
        )}

        <div className="text-center pt-4">
          <Link
            href="/team/competitions/declarations"
            className="text-[var(--verde)] font-semibold text-sm flex items-center justify-center gap-1"
          >
            <ExternalLink size={14} />
            Gerenciar minhas declarações
          </Link>
        </div>
      </section>
    </div>
  )
}
