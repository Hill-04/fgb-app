import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { CampeonatoTabs } from './CampeonatoTabs'
import type { ChampionshipData } from './CampeonatoTabs'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const championship = await prisma.championship.findUnique({
    where: { id },
    select: { name: true, description: true },
  }).catch(() => null)

  if (!championship) return { title: 'Campeonato não encontrado — FGB' }

  return {
    title: `${championship.name} — FGB`,
    description: championship.description ?? `Acompanhe o campeonato ${championship.name} da Federação Gaúcha de Basketball.`,
  }
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'Rascunho',
    REGISTRATION_OPEN: 'Inscrições Abertas',
    ONGOING: 'Em Andamento',
    FINISHED: 'Finalizado',
    CANCELLED: 'Cancelado',
  }
  return map[status] ?? status
}

function getStatusBadge(status: string) {
  if (status === 'ONGOING') return 'fgb-badge-red'
  if (status === 'REGISTRATION_OPEN') return 'fgb-badge-verde'
  if (status === 'FINISHED') return 'fgb-badge-outline'
  return 'fgb-badge-outline'
}

export default async function CampeonatoPublicPage({ params }: Props) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id, isSimulation: false },
    include: {
      categories: {
        include: {
          standings: {
            include: {
              team: { select: { name: true, city: true, logoUrl: true } },
            },
            orderBy: [
              { points: 'desc' },
              { diff: 'desc' },
              { pointsFor: 'desc' },
            ],
          },
          games: {
            where: { status: { in: ['SCHEDULED', 'ONGOING', 'FINISHED'] } },
            include: {
              homeTeam: { select: { name: true, logoUrl: true } },
              awayTeam: { select: { name: true, logoUrl: true } },
              refereeAssignments: {
                where: { role: 'MAIN' },
                include: { referee: { select: { name: true } } },
                take: 1,
              },
            },
            orderBy: [{ phase: 'asc' }, { round: 'asc' }, { dateTime: 'asc' }],
          },
        },
      },
      registrations: {
        where: { status: 'CONFIRMED' },
        include: {
          team: { select: { name: true, city: true, logoUrl: true } },
        },
        orderBy: { registeredAt: 'asc' },
      },
      _count: {
        select: {
          registrations: { where: { status: 'CONFIRMED' } },
          games: true,
        },
      },
    },
  }).catch(() => null)

  if (!championship) notFound()

  // ── Serialize for client component (no Date objects) ─────────────────────
  const data: ChampionshipData = {
    name: championship.name,
    year: championship.year,
    status: championship.status,
    sex: championship.sex,
    format: championship.format,
    startDate: championship.startDate?.toISOString() ?? null,
    endDate: championship.endDate?.toISOString() ?? null,
    hasPlayoffs: championship.hasPlayoffs,
    description: championship.description ?? null,
    totalTeams: championship._count?.registrations || 0,
    totalGames: championship._count?.games || 0,
    registrations: (championship.registrations || []).map((r) => ({
      team: {
        name: r.team?.name || 'Equipe',
        city: r.team?.city ?? null,
        logoUrl: r.team?.logoUrl ?? null,
      },
    })),
    categories: (championship.categories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      standings: (cat.standings || []).map((s) => ({
        id: s.id,
        played: s.played,
        wins: s.wins,
        losses: s.losses,
        points: s.points,
        pointsFor: s.pointsFor,
        pointsAgainst: s.pointsAgainst ?? 0,
        diff: s.diff,
        team: {
          name: s.team?.name || 'Equipe',
          city: s.team?.city ?? null,
          logoUrl: s.team?.logoUrl ?? null,
        },
      })),
      games: (cat.games || []).map((g) => ({
        id: g.id,
        phase: g.phase,
        round: g.round ?? null,
        dateTime: g.dateTime.toISOString(),
        location: g.location,
        city: g.city,
        status: g.status,
        homeScore: g.homeScore ?? null,
        awayScore: g.awayScore ?? null,
        homeTeam: {
          name: g.homeTeam?.name || 'Equipe Casa',
          logoUrl: g.homeTeam?.logoUrl ?? null,
        },
        awayTeam: {
          name: g.awayTeam?.name || 'Equipe Fora',
          logoUrl: g.awayTeam?.logoUrl ?? null,
        },
        mainReferee: g.refereeAssignments?.[0]?.referee?.name ?? null,
        categoryName: cat.name,
      })),
    })),
  }
  return (
    <div>
      <PublicHeader />

      {/* ── Header (unchanged) ───────────────────────────────────── */}
      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">
            <Link href="/" className="hover:text-white transition-colors">Início</Link> ·
            <Link href="/campeonatos" className="hover:text-white transition-colors"> Campeonatos</Link>
          </div>
          <div className="flex justify-center items-center gap-3 mb-4">
            <span className={`fgb-badge ${getStatusBadge(championship.status)} border-0 text-[10px] px-3 py-1.5`}>
              {getStatusLabel(championship.status)}
            </span>
            <span className="fgb-badge fgb-badge-outline text-[white] border-[rgba(255,255,255,0.2)]">
              {championship.sex}
            </span>
          </div>
          <h1 className="fgb-page-header-title" style={{ fontSize: 'clamp(28px, 4vw, 52px)' }}>
            {championship.name}
          </h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {/* ── Stats strip (unchanged) ──────────────────────────────── */}
        <div className="fgb-stats-strip rounded overflow-hidden mb-14 shadow-sm" style={{ border: '1px solid var(--border)' }}>
          {[
            { value: championship._count.registrations, label: 'Equipes' },
            { value: championship._count.games,         label: 'Jogos' },
            { value: championship.categories.length,    label: 'Categorias' },
            { value: championship.year,                 label: 'Temporada' },
          ].map((s, i) => (
            <div key={i} className="fgb-stats-strip-item" style={{ padding: '20px', background: '#fff' }}>
              <div className="fgb-stats-num" style={{ fontSize: 32, color: 'var(--verde)' }}>{s.value}</div>
              <div className="fgb-stats-label text-[var(--gray)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabbed content ───────────────────────────────────────── */}
        <CampeonatoTabs championship={data} />

        <div className="text-center mt-16">
          <Link
            href="/campeonatos"
            className="fgb-btn-secondary"
            style={{ borderColor: 'var(--border)', color: 'var(--black)', background: 'var(--gray-l)' }}
          >
            Voltar para Campeonatos
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
