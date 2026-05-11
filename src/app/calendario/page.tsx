import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { FgbImage } from '@/components/FgbImage'

export const metadata: Metadata = {
  title: 'Calendario — FGB',
  description: 'Calendario geral de jogos e competicoes da Federacao Gaucha de Basketball.',
}

type GameItem = {
  id: string
  dateTime: Date
  status: string
  homeTeam: { name: string; logoUrl: string | null }
  awayTeam: { name: string; logoUrl: string | null }
  category: { name: string; championship: { name: string } }
}

export default async function CalendarioPage() {
  const today = new Date()
  const games = await prisma.game.findMany({
    where: {
      status: { not: 'CANCELLED' },
      dateTime: { gte: today }
    },
    include: {
      homeTeam: { select: { name: true, logoUrl: true } },
      awayTeam: { select: { name: true, logoUrl: true } },
      category: { include: { championship: { select: { name: true } } } },
    },
    orderBy: { dateTime: 'asc' },
    take: 80,
  }).catch(() => [])

  const grouped = games.reduce((acc: Record<string, GameItem[]>, game) => {
    const key = game.dateTime.toISOString().slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(game as GameItem)
    return acc
  }, {})

  const days = Object.keys(grouped)

  return (
    <div>
      <PublicHeader />

      <div className="fgb-page-header">
        <div className="fgb-page-header-bg" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative text-center">
          <div className="fgb-page-header-eyebrow">Agenda</div>
          <h1 className="fgb-page-header-title">Calendario de Jogos</h1>
          <p className="fgb-page-header-sub mx-auto">
            Programacao completa das competicoes oficiais da temporada.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        {days.length === 0 ? (
          <div className="fgb-card p-8 text-center">
            <p className="fgb-label" style={{ color: 'var(--gray)' }}>Nenhum jogo agendado no momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day) => (
              <div key={day} className="fgb-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="fgb-display text-[16px] text-[var(--black)]">{new Date(day).toLocaleDateString('pt-BR')}</h2>
                  <span className="fgb-badge fgb-badge-outline">{grouped[day].length} jogos</span>
                </div>
                <div className="space-y-3">
                  {grouped[day].map((game) => (
                    <div key={game.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-[var(--border)] rounded-lg p-3 bg-white">
                      <div className="fgb-label text-[var(--gray)] sm:w-40 flex-shrink-0">
                        {new Date(game.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {game.category.championship.name}
                      </div>
                      <div className="flex items-center gap-3 flex-1 justify-center">
                        <div className="w-7 h-7 flex-shrink-0 rounded overflow-hidden">
                          <FgbImage variant="logo" src={game.homeTeam.logoUrl} initials={game.homeTeam.name.slice(0,2)} alt={game.homeTeam.name} tint="green" />
                        </div>
                        <span className="fgb-display text-[14px] text-[var(--black)] truncate">{game.homeTeam.name}</span>
                        <span className="fgb-label text-[var(--gray)] mx-1">×</span>
                        <span className="fgb-display text-[14px] text-[var(--black)] truncate">{game.awayTeam.name}</span>
                        <div className="w-7 h-7 flex-shrink-0 rounded overflow-hidden">
                          <FgbImage variant="logo" src={game.awayTeam.logoUrl} initials={game.awayTeam.name.slice(0,2)} alt={game.awayTeam.name} tint="navy" />
                        </div>
                      </div>
                      <span className="fgb-badge fgb-badge-outline">{game.category.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
