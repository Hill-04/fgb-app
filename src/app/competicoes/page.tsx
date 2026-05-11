import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { formatChampionshipStatus } from '@/lib/utils'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FgbImage } from '@/components/FgbImage'
import { FgbRibbon } from '@/components/FgbRibbon'
import { AlertTriangle, Volleyball, BadgeCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Competicoes — FGB',
  description: 'Competicoes oficiais e calendarios da Federacao Gaucha de Basketball.',
}

export const dynamic = 'force-dynamic'

export default async function CompeticoesPage() {
  await ensureDatabaseSchema()

  const championships = await prisma.championship.findMany({
    where: { isSimulation: false },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: { select: { name: true } },
      _count: { select: { registrations: { where: { status: 'CONFIRMED' } }, games: true } },
    },
  }).catch(() => [])

  const externals = await prisma.externalCompetition.findMany({
    where: { isPublished: true },
    orderBy: { startDate: 'asc' },
    include: {
      blocks: { include: { championship: { select: { id: true, name: true } } } },
    },
  }).catch(() => [])

  const fmtDate = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'

  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Temporada 2026</div>
          <h1 className="fgb-page-header-title">Competições 2026</h1>
          <p className="fgb-page-header-sub mx-auto">
            Escolha onde sua equipe vai competir nesta temporada.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-12">
        {/* SEÇÃO 1 — Competições Oficiais FGB */}
        <section
          className="rounded-xl p-6 sm:p-10"
          style={{ background: 'rgba(20,85,48,0.04)', border: '2px solid rgba(20,85,48,0.15)' }}
        >
          <div className="text-center mb-8">
            <div className="inline-block mb-3">
              <FgbRibbon variant="amarelo" icon={BadgeCheck}>Competição Oficial FGB</FgbRibbon>
            </div>
            <h2 className="fgb-display text-[28px] text-[var(--verde)]">
              Federação Gaúcha de Basquete
            </h2>
            <p className="text-sm text-[var(--gray)] mt-2 max-w-2xl mx-auto">
              Ranking oficial · Estrutura profissional · Certificação CBB · Visibilidade estadual
            </p>
          </div>

          {championships.length === 0 ? (
            <div className="fgb-card p-8 text-center">
              <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhuma competição cadastrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {championships.map((c) => (
                <Link
                  key={c.id}
                  href={`/campeonatos/${c.id}`}
                  className="fgb-card overflow-hidden"
                  style={{ borderLeft: '4px solid var(--verde)' }}
                >
                  <div className="aspect-[16/9] relative">
                    <FgbImage
                      variant="cover"
                      tint="green"
                      icon={Volleyball}
                      alt={c.name}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="fgb-badge fgb-badge-outline">{formatChampionshipStatus(c.status)}</span>
                    <span className="fgb-label" style={{ color: 'var(--gray)' }}>{c.year}</span>
                  </div>
                  <h3 className="fgb-display text-[18px] text-[var(--black)] mb-2">{c.name}</h3>
                  <p className="fgb-label text-[var(--gray)] mb-4" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {c.description || 'Competição oficial da Federação Gaúcha de Basquete.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {c.categories.slice(0, 4).map((cat) => (
                      <span key={cat.name} className="fgb-badge fgb-badge-outline">{cat.name}</span>
                    ))}
                  </div>
                  <ul className="text-xs space-y-1 mb-4 text-[var(--verde)]">
                    <li>✓ Ranqueamento estadual oficial</li>
                    <li>✓ Estrutura profissional</li>
                    <li>✓ Documentos CBB</li>
                  </ul>
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="fgb-label" style={{ color: 'var(--gray)' }}>{c._count.registrations} equipes</span>
                    <span className="fgb-label" style={{ color: 'var(--verde)' }}>{c._count.games} jogos</span>
                  </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* DIVIDER */}
        <div
          className="rounded-lg p-5 flex items-start gap-3"
          style={{ background: 'rgba(229,171,0,0.10)', borderLeft: '5px solid var(--fgb-yellow-500)' }}
        >
          <AlertTriangle size={28} className="flex-shrink-0" style={{ color: 'var(--fgb-yellow-600)', strokeWidth: 2 }} aria-hidden />
          <div>
            <h3 className="fgb-display text-[16px] text-[var(--black)] mb-1">
              EXCLUSIVIDADE DE INSCRIÇÃO
            </h3>
            <p className="text-sm text-[var(--black)]">
              As competições abaixo são organizadas por terceiros. A inscrição nelas
              <strong> impede</strong> a participação nos campeonatos oficiais da FGB. Escolha com atenção.
            </p>
          </div>
        </div>

        {/* SEÇÃO 2 — Externas */}
        <section>
          <h2 className="fgb-display text-[20px] text-[var(--black)] mb-4">
            Calendário Geral — Competições de Terceiros
          </h2>

          {externals.length === 0 ? (
            <div className="fgb-card p-8 text-center text-[var(--gray)]">
              Nenhuma competição externa publicada.
            </div>
          ) : (
            <div className="space-y-3">
              {externals.map((e) => (
                <div
                  key={e.id}
                  className="fgb-card p-4 flex items-start gap-4"
                  style={{ borderLeft: '3px solid var(--gray)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="fgb-badge fgb-badge-outline text-[10px]">EXTERNO</span>
                      <h3 className="fgb-display text-[16px] text-[var(--black)]">{e.name}</h3>
                    </div>
                    <p className="text-xs text-[var(--gray)] mb-1">
                      {e.organizer}
                      {e.city && ` · ${e.city}`}
                      {e.state && `/${e.state}`}
                    </p>
                    <p className="text-xs text-[var(--gray)]">
                      {fmtDate(e.startDate)} → {fmtDate(e.endDate)}
                    </p>
                    {e.blocks.length > 0 && (
                      <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: 'var(--red)' }}>
                        <AlertTriangle size={12} aria-hidden />
                        <span>Impede participação em:{' '}
                          {e.blocks.map((b) => b.championship.name).join(', ')}</span>
                      </p>
                    )}
                  </div>
                  {e.websiteUrl && (
                    <a
                      href={e.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--verde)] uppercase tracking-wide font-semibold flex-shrink-0"
                    >
                      Site →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
