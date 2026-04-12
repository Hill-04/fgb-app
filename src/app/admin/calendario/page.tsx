import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function CalendarioGlobal() {
  const games = await prisma.game.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      category: {
        select: {
          name: true,
          championship: { select: { id: true, name: true, status: true } }
        }
      }
    },
    orderBy: { dateTime: 'asc' }
  }).catch(() => [])

  type GameRow = (typeof games)[number]

  const byDate = games.reduce((acc, g) => {
    const key = new Date(g.dateTime).toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {} as Record<string, GameRow[]>)

  const dates = Object.keys(byDate).sort()

  return (
    <div style={{ padding: 24 }}>
      <div className="fgb-section-header">
        <div>
          <div className="fgb-accent fgb-accent-verde" />
          <h1 className="fgb-section-title">Calendario <span className="verde">Geral</span></h1>
        </div>
      </div>

      {dates.length === 0 && (
        <p className="fgb-label" style={{ color: 'var(--gray)', padding: '32px 0' }}>
          Nenhum jogo agendado ainda.
        </p>
      )}

      {dates.map(date => (
        <div key={date} style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 0', marginBottom: 8,
            borderBottom: '2px solid var(--black)'
          }}>
            <h2 className="fgb-heading" style={{ fontSize: 16 }}>
              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
              })}
            </h2>
            <span className="fgb-label" style={{ color: 'var(--gray)' }}>
              {byDate[date].length} jogo(s)
            </span>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)' }}>
            {byDate[date].map((g, i) => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 16px', gap: 12,
                borderBottom: i < byDate[date].length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <span className="fgb-label" style={{ width: 52, flexShrink: 0, color: 'var(--gray)' }}>
                  {new Date(g.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="fgb-label" style={{
                  width: 80, flexShrink: 0, fontSize: 9,
                  color: 'var(--verde)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {g.category.name}
                </span>
                <span className="fgb-heading" style={{ flex: 1, fontSize: 13 }}>
                  {g.homeTeam.name}
                </span>
                <span className="fgb-label" style={{ color: 'var(--gray)' }}>×</span>
                <span className="fgb-heading" style={{ flex: 1, fontSize: 13 }}>
                  {g.awayTeam.name}
                </span>
                <span className="fgb-label" style={{
                  fontSize: 9, color: 'var(--gray)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 140
                }}>
                  {g.category.championship.name}
                </span>
                <StatusBadge status={g.status} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    SCHEDULED: { label: 'Agendado', bg: 'var(--gray-l)', color: 'var(--gray)' },
    FINISHED: { label: 'Finalizado', bg: 'var(--verde-light)', color: 'var(--verde)' },
    CANCELLED: { label: 'Cancelado', bg: 'var(--red-light)', color: 'var(--red)' },
    POSTPONED: { label: 'Adiado', bg: 'var(--yellow-light)', color: 'var(--yellow-dark)' },
  }
  const item = map[status] ?? { label: status, bg: 'var(--gray-l)', color: 'var(--gray)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      padding: '3px 10px',
      background: item.bg, color: item.color
    }}>
      {item.label}
    </span>
  )
}
