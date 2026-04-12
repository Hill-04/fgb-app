import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ChampionshipDashboard({
  params
}: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    include: { categories: true }
  }).catch(() => null)

  if (!championship) notFound()

  const [registrationsCount, gamesCount, nextGame] = await Promise.all([
    prisma.registration.count({
      where: {
        championship: { id }
      }
    }).catch(() => 0),

    prisma.game.count({
      where: {
        category: { championshipId: id },
        status: { not: 'CANCELLED' }
      }
    }).catch(() => 0),

    prisma.game.findFirst({
      where: {
        category: { championshipId: id },
        status: 'SCHEDULED',
        dateTime: { gte: new Date() }
      },
      orderBy: { dateTime: 'asc' },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        category: { select: { name: true } }
      }
    }).catch(() => null)
  ])

  const actionMap: Record<string, { label: string; href: string }> = {
    DRAFT:               { label: 'Configurar campeonato', href: 'settings' },
    REGISTRATION_OPEN:   { label: 'Gerenciar inscricoes',  href: 'registrations' },
    REGISTRATION_CLOSED: { label: 'Organizar com IA',      href: 'organize' },
    ORGANIZING:          { label: 'Revisar calendario',    href: 'matches' },
    ACTIVE:              { label: 'Registrar resultado',   href: 'matches' },
    FINISHED:            { label: 'Ver classificacao',     href: 'standings' },
  }
  const actionButton = actionMap[championship.status] ?? {
    label: 'Ver campeonato',
    href: '#'
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 24
      }}>
        {[
          { label: 'Categorias', value: championship.categories.length },
          { label: 'Inscricoes', value: registrationsCount },
          { label: 'Jogos gerados', value: gamesCount },
          {
            label: 'Proximo jogo',
            value: nextGame
              ? new Date(nextGame.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
              : '—'
          }
        ].map(card => (
          <div key={card.label} style={{
            background: 'var(--gray-l)',
            borderRadius: 12,
            padding: '16px',
            textAlign: 'center'
          }}>
            <p className="fgb-label" style={{ color: 'var(--gray)', marginBottom: 6 }}>
              {card.label}
            </p>
            <p className="fgb-display" style={{ fontSize: 28, color: 'var(--black)' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <Link
          href={actionButton.href === '#' ? '#' : `/admin/championships/${id}/${actionButton.href}`}
          className="fgb-btn-primary"
          style={{ fontSize: 15, padding: '14px 32px' }}
        >
          {actionButton.label} →
        </Link>
      </div>

      {nextGame && (
        <div className="fgb-card" style={{ padding: 16, maxWidth: 400, margin: '0 auto' }}>
          <p className="fgb-label" style={{ color: 'var(--gray)', marginBottom: 8 }}>
            Proximo jogo - {nextGame.category.name}
          </p>
          <p className="fgb-heading" style={{ fontSize: 16 }}>
            {nextGame.homeTeam.name} × {nextGame.awayTeam.name}
          </p>
          <p className="fgb-label" style={{ color: 'var(--verde)', marginTop: 4 }}>
            {new Date(nextGame.dateTime).toLocaleString('pt-BR')}
          </p>
        </div>
      )}
    </div>
  )
}
