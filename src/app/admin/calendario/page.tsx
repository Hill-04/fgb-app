import { prisma } from '@/lib/db'
import { Badge } from '@/components/Badge'
import { CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'SCHEDULED', label: 'Agendado' },
  { value: 'FINISHED', label: 'Finalizado' },
  { value: 'POSTPONED', label: 'Adiado' },
]

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ championshipId?: string; categoryId?: string; status?: string }>
}) {
  const params = await searchParams
  const selectedChampionship = params.championshipId ?? ''
  const selectedCategory = params.categoryId ?? ''
  const selectedStatus = params.status ?? ''

  try {
    const championships = await prisma.championship.findMany({
      where: { status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true }
    })

    const categories = selectedChampionship
      ? await prisma.championshipCategory.findMany({
          where: { championshipId: selectedChampionship },
          orderBy: { name: 'asc' },
          select: { id: true, name: true }
        })
      : []

    const games = await prisma.game.findMany({
      where: {
        ...(selectedStatus
          ? { status: selectedStatus as any }
          : { status: { not: 'CANCELLED' } }),
        ...(selectedChampionship
          ? { category: { championshipId: selectedChampionship } }
          : {}),
        ...(selectedCategory ? { categoryId: selectedCategory } : {}),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        category: { include: { championship: { select: { id: true, name: true } } } },
      },
      orderBy: { dateTime: 'asc' }
    })

    const grouped = games.reduce((acc, game) => {
      const key = format(game.dateTime, 'yyyy-MM-dd')
      if (!acc[key]) acc[key] = []
      acc[key].push(game)
      return acc
    }, {} as Record<string, typeof games>)

    const dates = Object.keys(grouped).sort((a, b) => a.localeCompare(b))

    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="fgb-label text-[var(--verde)]" style={{ fontSize: 10 }}>Visão Geral</span>
              <span className="fgb-badge fgb-badge-verde">CALENDÁRIO</span>
            </div>
            <h1 className="fgb-display text-3xl text-[var(--black)]">Calendário Geral</h1>
            <p className="fgb-label text-[var(--gray)] mt-1" style={{ textTransform: 'none', letterSpacing: 0 }}>
              {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="fgb-card px-4 py-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[var(--verde)]" />
            <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Consulta somente</span>
          </div>
        </div>

        <form className="fgb-card p-4 grid grid-cols-1 md:grid-cols-3 gap-3" method="GET">
          <div className="flex flex-col gap-2">
            <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Campeonato</label>
            <select
              name="championshipId"
              defaultValue={selectedChampionship}
              className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--black)]"
            >
              <option value="">Todos</option>
              {championships.map((champ) => (
                <option key={champ.id} value={champ.id}>{champ.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Categoria</label>
            <select
              name="categoryId"
              defaultValue={selectedCategory}
              className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--black)]"
            >
              <option value="">Todas</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>Status</label>
            <select
              name="status"
              defaultValue={selectedStatus}
              className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-xs font-bold text-[var(--black)]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3 flex items-center justify-end">
            <button type="submit" className="fgb-btn-primary h-10 px-6 rounded-xl">Filtrar</button>
          </div>
        </form>

        {dates.length === 0 ? (
          <div className="fgb-card p-16 text-center">
            <p className="fgb-label text-[var(--gray)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Nenhum jogo agendado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {dates.map((dateKey) => {
              const dateLabel = format(new Date(`${dateKey}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR })
              const dayGames = grouped[dateKey]
              return (
                <div key={dateKey} className="fgb-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--gray-l)]">
                    <div>
                      <p className="fgb-display text-sm text-[var(--black)]">{dateLabel}</p>
                      <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 9 }}>
                        {dayGames.length} jogo(s)
                      </p>
                    </div>
                    <Badge variant="purple" size="sm">Consulta</Badge>
                  </div>
                  <div className="divide-y divide-[var(--border)] bg-white">
                    {dayGames.map((game) => (
                      <div key={game.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-[var(--black)] tabular-nums">
                            {format(game.dateTime, 'HH:mm')}
                          </span>
                          <div>
                            <p className="text-sm font-black text-[var(--black)]">
                              {game.homeTeam.name} <span className="opacity-40 font-medium px-1">×</span> {game.awayTeam.name}
                            </p>
                            <p className="fgb-label text-[var(--gray)] mt-1" style={{ fontSize: 9 }}>
                              {game.category.name} · {game.category.championship.name}
                            </p>
                          </div>
                        </div>
                        <Badge variant={game.status === 'FINISHED' ? 'success' : 'purple'} size="sm">
                          {game.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('[ADMIN CALENDAR ERROR]', error)
    return (
      <div className="fgb-card p-16 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar jogos.
        </p>
      </div>
    )
  }
}
