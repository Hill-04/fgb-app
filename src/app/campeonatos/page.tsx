import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'

export const metadata: Metadata = {
  title: 'Campeonatos — FGB',
  description: 'Lista oficial de campeonatos da Federação Gaúcha de Basketball. Estaduais, categorias e tabelas de classificação.',
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

function getSexIcon(sex: string) {
  if (sex === 'feminino') return '♀️'
  if (sex === 'masculino') return '♂️'
  return '⚥'
}

export default async function CampeonatosPage() {
  const allChampionships = await prisma.championship.findMany({
    where: {
      status: { not: 'DRAFT' },
      isSimulation: false,
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      categories: { select: { id: true, name: true } },
      _count: { select: { registrations: true, games: true } },
    },
  }).catch(() => [])

  const ongoing = allChampionships.filter((c) => c.status === 'ONGOING')
  const open = allChampionships.filter((c) => c.status === 'REGISTRATION_OPEN')
  const finished = allChampionships.filter((c) => c.status === 'FINISHED')

  function ChampionshipCard({ c }: { c: typeof allChampionships[0] }) {
    const isFinished = c.status === 'FINISHED'
    return (
      <Link
        href={`/campeonatos/${c.id}`}
        className={`fgb-card block p-6 ${isFinished ? '' : 'admin-card-verde'}`}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getSexIcon(c.sex)}</span>
            <span className="text-2xl">🏀</span>
          </div>
          <span className={`fgb-badge ${getStatusBadge(c.status)}`}>
            {getStatusLabel(c.status)}
          </span>
        </div>
        <h3 className="fgb-display mb-2 text-[18px] text-[var(--black)] transition-colors line-clamp-2">
          {c.name}
        </h3>
        <p className="fgb-label text-[var(--gray)] mb-4">
          {c.categories.length > 0
            ? c.categories.map((cat) => cat.name).join(' · ')
            : 'Categorias a definir'}
        </p>
        <div className="flex items-center justify-between pt-4" style={{ borderTop: '0.5px solid var(--border)' }}>
          <div className="flex items-center gap-3 fgb-label text-[var(--gray)]">
            <span>{c._count.registrations} equipes</span>
            <span>·</span>
            <span>{c._count.games} jogos</span>
          </div>
          <span className="fgb-label text-[var(--verde)]">Ver →</span>
        </div>
      </Link>
    )
  }

  function Section({ title, items, colorClass, emptyMsg, accentClass }: any) {
    return (
      <section className="mb-14">
        <div className="fgb-section-header">
          <div>
            <div className={`fgb-accent ${accentClass}`} />
            <h2 className="fgb-section-title">
              {title.split(' ')[0]} <span className={colorClass}>{title.split(' ').slice(1).join(' ')}</span>
            </h2>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="text-center py-12 bg-[var(--gray-l)] border border-[var(--border)] rounded">
            <p className="fgb-label text-[var(--gray)]">{emptyMsg}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((c: any) => (
              <ChampionshipCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>
    )
  }

  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">FGB · Temporada 2026</div>
          <h1 className="fgb-page-header-title">Campeonatos</h1>
          <p className="fgb-page-header-sub mx-auto">
            Todos os campeonatos oficiais organizados pela Federação Gaúcha de Basketball.
            Acompanhe classificações, jogos e resultados em tempo real.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <Section
          title="Em Andamento"
          colorClass="orange"
          accentClass="fgb-accent-orange"
          items={ongoing}
          emptyMsg="Nenhum campeonato em andamento no momento."
        />

        <Section
          title="Inscrições Abertas"
          colorClass="verde"
          accentClass="fgb-accent-verde"
          items={open}
          emptyMsg="Nenhum campeonato com inscrições abertas no momento."
        />

        <Section
          title="Finalizados "
          colorClass=""
          accentClass="fgb-accent-yellow"
          items={finished}
          emptyMsg="Nenhum campeonato finalizado."
        />

        {/* Área restrita CTA */}
        <div className="mt-12 fgb-cta" style={{ padding: '40px 24px', borderRadius: 8 }}>
          <div className="fgb-cta-pattern" />
          <div className="fgb-cta-inner flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <h2 className="fgb-display text-white text-[24px] mb-2">Inscreva sua equipe</h2>
              <p className="fgb-label text-[rgba(255,255,255,0.6)] max-w-md" style={{ textTransform: 'none', letterSpacing: '0' }}>
                Para inscrever sua equipe em campeonatos, faça login ou cadastre-se na plataforma FGB. O processo é 100% digital.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/login" className="fgb-btn-primary">Entrar</Link>
              <Link href="/register" className="fgb-btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Cadastrar</Link>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  )
}
