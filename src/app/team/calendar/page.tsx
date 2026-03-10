import prisma from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function TeamCalendarPage() {
  // Fetch upcoming games (likely empty for now)
  const upcomingMatches = await prisma.game.findMany({
    where: {
      status: 'SCHEDULED',
      dateTime: { gte: new Date() },
    },
    orderBy: { dateTime: 'asc' },
    take: 10,
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      category: { select: { name: true } },
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Calendário de Jogos</h1>
        <p className="text-slate-400">Confira os próximos jogos agendados para sua equipe.</p>
      </div>

      {/* Info Card */}
      <Card className="bg-slate-900/50 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendário da Temporada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">
            O calendário completo estará disponível após a definição dos agendamentos pela federação.
          </p>
        </CardContent>
      </Card>

      {/* Upcoming matches */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Próximos Jogos</h2>
        {upcomingMatches.length === 0 ? (
          <Card className="bg-slate-900/50 border-white/10 text-white">
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4 opacity-30">
                <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Nenhum jogo agendado</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Assim que a federação publicar o calendário, os seus jogos aparecerão aqui.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingMatches.map((match) => (
              <Card key={match.id} className="bg-slate-900/50 border-white/10 text-white">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          {match.category.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {match.location}, {match.city}
                        </span>
                      </div>
                      <p className="font-semibold text-white">
                        {match.homeTeam.name} <span className="text-slate-500 font-normal">vs</span> {match.awayTeam.name}
                      </p>
                    </div>
                    {match.dateTime && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-orange-400 font-semibold text-sm">
                          {new Date(match.dateTime).toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {new Date(match.dateTime).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
