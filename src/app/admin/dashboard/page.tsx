import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [championships, totalRegs, upcomingGames] = await Promise.all([
    prisma.championship.findMany({
      where: { status: { not: 'FINISHED' } },
      include: { categories: true, _count: { select: { registrations: true } } },
      orderBy: { createdAt: 'desc' }
    }).catch(() => []),

    prisma.registration.count({ where: { status: 'CONFIRMED' } }).catch(() => 0),

    prisma.game.findMany({
      where: { status: 'SCHEDULED', dateTime: { gte: new Date() } },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
        category: {
          select: {
            name: true,
            championship: { select: { name: true } }
          }
        }
      },
      orderBy: { dateTime: 'asc' },
      take: 5
    }).catch(() => [])
  ])

  const pendingRegs = await prisma.registration
    .count({ where: { status: 'PENDING' } })
    .catch(() => 0)

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
        marginBottom: 28
      }}>
        {[
          { label: 'Campeonatos ativos', value: championships.length },
          { label: 'Equipes confirmadas', value: totalRegs },
          { label: 'Inscricoes pendentes', value: pendingRegs },
          { label: 'Proximos jogos', value: upcomingGames.length },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--gray-l)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center'
          }}>
            <p className="fgb-label" style={{ color: 'var(--gray)', marginBottom: 6, fontSize: 9 }}>
              {stat.label}
            </p>
            <p className="fgb-display" style={{ fontSize: 28 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {championships.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-verde" />
              <h2 className="fgb-section-title">Campeonatos <span className="verde">Ativos</span></h2>
            </div>
            <a href="/admin/championships" className="fgb-section-link">Ver todos →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {championships.map(c => (
              <a
                key={c.id}
                href={`/admin/championships/${c.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s'
                }}
                className="fgb-card"
              >
                <div>
                  <p className="fgb-heading" style={{ fontSize: 14, color: 'var(--black)' }}>
                    {c.name}
                  </p>
                  <p className="fgb-label" style={{ color: 'var(--gray)', marginTop: 2 }}>
                    {c.categories.length} categorias · {c._count.registrations} inscricoes
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </a>
            ))}
          </div>
        </div>
      )}

      {upcomingGames.length > 0 && (
        <div>
          <div className="fgb-section-header">
            <div>
              <div className="fgb-accent fgb-accent-red" />
              <h2 className="fgb-section-title">Proximos <span className="red">Jogos</span></h2>
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)' }}>
            {upcomingGames.map((g, i) => (
              <div key={g.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 16px',
                gap: 12,
                borderBottom: i < upcomingGames.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <span className="fgb-label" style={{ color: 'var(--gray)', width: 100, flexShrink: 0 }}>
                  {new Date(g.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{' '}
                  {new Date(g.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="fgb-label" style={{ color: 'var(--tx2)', flex: 1 }}>
                  {g.homeTeam.name} × {g.awayTeam.name}
                </span>
                <span className="fgb-label" style={{ color: 'var(--gray)', fontSize: 9 }}>
                  {g.category.name} - {g.category.championship.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {championships.length === 0 && upcomingGames.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p className="fgb-label" style={{ color: 'var(--gray)', marginBottom: 16 }}>
            Nenhum campeonato ativo
          </p>
          <a href="/admin/championships/new" className="fgb-btn-primary">
            Criar primeiro campeonato
          </a>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string; pulse?: boolean }> = {
    DRAFT:                { label: 'Rascunho',            bg: 'var(--gray-l)',       color: 'var(--gray)' },
    REGISTRATION_OPEN:    { label: 'Inscricoes abertas',  bg: 'var(--verde-light)',  color: 'var(--verde)', pulse: true },
    REGISTRATION_CLOSED:  { label: 'Inscricoes encerradas',bg:'var(--yellow-light)', color: 'var(--yellow-dark)' },
    ORGANIZING:           { label: 'Organizando',         bg: '#e8f0fe',             color: '#1a56db' },
    ACTIVE:               { label: 'Em andamento',        bg: 'var(--verde-light)',  color: 'var(--verde)', pulse: true },
    FINISHED:             { label: 'Encerrado',           bg: 'var(--gray-l)',       color: 'var(--gray)' },
  }
  const s = map[status] ?? { label: status, bg: 'var(--gray-l)', color: 'var(--gray)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      padding: '3px 10px',
      background: s.bg, color: s.color
    }}>
      {s.pulse && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: s.color,
          animation: 'fgb-pulse 1.4s ease-in-out infinite'
        }} />
      )}
      {s.label}
    </span>
  )
}

