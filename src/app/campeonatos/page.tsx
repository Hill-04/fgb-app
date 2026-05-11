import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FgbImage } from '@/components/FgbImage'
import { CountUp } from '@/components/motion/CountUp'
import { StaggerGrid } from '@/components/motion/StaggerGrid'
import { Mars, Venus, Users, Volleyball } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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

function getSexIcon(sex: string): LucideIcon {
  if (sex === 'feminino') return Venus
  if (sex === 'masculino') return Mars
  return Users
}

function getSexTint(sex: string): 'green' | 'yellow' | 'navy' {
  if (sex === 'feminino') return 'yellow'
  if (sex === 'masculino') return 'green'
  return 'navy'
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
    const SexIcon = getSexIcon(c.sex)
    return (
      <Link
        href={`/campeonatos/${c.id}`}
        className={`fgb-card block overflow-hidden ${isFinished ? '' : 'admin-card-verde'}`}
      >
        <div className="aspect-[16/9] relative">
          <FgbImage
            variant="cover"
            tint={getSexTint(c.sex)}
            icon={Volleyball}
            alt={c.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
            <SexIcon size={14} style={{ color: 'var(--fgb-yellow-400)', strokeWidth: 2 }} aria-hidden />
            <span className="fgb-label text-white" style={{ fontSize: 9 }}>{c.sex === 'feminino' ? 'Feminino' : c.sex === 'masculino' ? 'Masculino' : 'Misto'}</span>
          </div>
          <span className={`fgb-badge ${getStatusBadge(c.status)} absolute top-3 right-3`}>
            {getStatusLabel(c.status)}
          </span>
        </div>
        <div className="p-6">
          <h3 className="fgb-display mb-2 text-[18px] text-[var(--black)] transition-colors line-clamp-2">
            {c.name}
          </h3>
          <p className="fgb-label text-[var(--gray)] mb-4">
            {c.categories.length > 0
              ? c.categories.map((cat) => cat.name).join(' · ')
              : 'Categorias a definir'}
          </p>
          <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 fgb-label text-[var(--gray)]">
              <CountUp value={c._count.registrations} suffix=" equipes" />
              <span>·</span>
              <CountUp value={c._count.games} suffix=" jogos" />
            </div>
            <span className="fgb-label text-[var(--verde)]">Ver →</span>
          </div>
        </div>
      </Link>
    )
  }

  function FeaturedChampionshipCard({ c }: { c: any }) {
    const SexIcon = getSexIcon(c.sex)
    return (
      <Link
        href={`/campeonatos/${c.id}`}
        className="fgb-card block overflow-hidden mb-5 admin-card-verde"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch">
          {/* IMAGEM */}
          <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[280px]">
            <FgbImage
              variant="cover"
              tint={getSexTint(c.sex)}
              icon={Volleyball}
              alt={c.name}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent md:bg-gradient-to-t md:from-black/55 md:via-black/15 md:to-transparent" />
            <span
              className="absolute top-4 left-4 fgb-badge"
              style={{
                background: 'var(--fgb-yellow-500)',
                color: 'var(--fgb-ink-900)',
                fontWeight: 800,
                letterSpacing: '0.18em',
              }}
            >
              Em destaque
            </span>
          </div>

          {/* CONTENT */}
          <div className="p-7 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className={`fgb-badge ${getStatusBadge(c.status)}`}>
                {getStatusLabel(c.status)}
              </span>
              <div className="inline-flex items-center gap-1.5 fgb-label" style={{ color: 'var(--fgb-ink-500)' }}>
                <SexIcon size={12} aria-hidden />
                <span>{c.sex === 'feminino' ? 'Feminino' : c.sex === 'masculino' ? 'Masculino' : 'Misto'}</span>
              </div>
            </div>
            <h3
              className="mb-3"
              style={{
                fontFamily: 'var(--font-anton)',
                fontSize: 'clamp(28px, 3vw, 38px)',
                lineHeight: 1.05,
                textTransform: 'uppercase',
                color: 'var(--fgb-ink-900)',
              }}
            >
              {c.name}
            </h3>
            {c.categories.length > 0 && (
              <p className="fgb-label mb-5" style={{ color: 'var(--fgb-ink-500)' }}>
                {c.categories.slice(0, 6).map((cat: any) => cat.name).join(' · ')}
              </p>
            )}
            <div className="flex items-center gap-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: 'var(--font-anton)',
                    fontSize: 28,
                    lineHeight: 1,
                    color: 'var(--fgb-green-700)',
                  }}
                >
                  <CountUp value={c._count.registrations} />
                </div>
                <div className="fgb-label mt-1" style={{ color: 'var(--gray)' }}>equipes</div>
              </div>
              <div className="w-px h-10" style={{ background: 'var(--border)' }} />
              <div>
                <div
                  className="tabular-nums"
                  style={{
                    fontFamily: 'var(--font-anton)',
                    fontSize: 28,
                    lineHeight: 1,
                    color: 'var(--fgb-green-700)',
                  }}
                >
                  <CountUp value={c._count.games} />
                </div>
                <div className="fgb-label mt-1" style={{ color: 'var(--gray)' }}>jogos</div>
              </div>
              <div className="flex-1 text-right">
                <span className="fgb-label" style={{ color: 'var(--verde)' }}>Ver campeonato →</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  function Section({ title, items, colorClass, emptyMsg, accentClass, featured }: any) {
    const [first, ...rest] = items
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
        ) : featured ? (
          <>
            <FeaturedChampionshipCard c={first} />
            {rest.length > 0 && (
              <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" stagger={0.08}>
                {rest.map((c: any) => (
                  <ChampionshipCard key={c.id} c={c} />
                ))}
              </StaggerGrid>
            )}
          </>
        ) : (
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" stagger={0.08}>
            {items.map((c: any) => (
              <ChampionshipCard key={c.id} c={c} />
            ))}
          </StaggerGrid>
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
          featured
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
