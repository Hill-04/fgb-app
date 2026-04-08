import { prisma } from '@/lib/db'
import { RegisterResultButton } from './RegisterResultButton'
import { GenerateSumulaButton } from './GenerateSumulaButton'

export default async function MatchesPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params

  const games = await prisma.game.findMany({
    where: { championshipId: id },
    include: {
      homeTeam: { select: { id: true, name: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, logoUrl: true } },
      category: { select: { id: true, name: true } }
    },
    orderBy: [{ dateTime: 'asc' }, { round: 'asc' }]
  })

  const gamesByDate = games.reduce((acc, game) => {
    const dateKey = new Date(game.dateTime).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    })
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(game)
    return acc
  }, {} as Record<string, typeof games>)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <h2 className="fgb-display text-xl text-[var(--black)] leading-none">
          Próximos Jogos & Resultados
        </h2>
        <div className="flex items-center gap-2">
           <span className="fgb-label text-[var(--gray)]" style={{ fontSize: 10, letterSpacing: 2 }}>
             Total: {games.length} jogos
           </span>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="fgb-card p-12 text-center bg-white">
          <p className="text-sm font-sans text-[var(--gray)] italic">Nenhum jogo agendado ainda. Vá para a aba Organização para gerar o calendário.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(gamesByDate).map(([date, dayGames]) => (
            <div key={date} className="space-y-4">
              {/* Header da data */}
              <div className="flex items-center gap-3 py-2 sticky top-0 bg-[var(--background)] z-10">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-[10px] font-black font-sans uppercase tracking-widest text-[var(--black)] px-4 py-1.5 bg-[var(--yellow)] border border-[var(--orange-dark)]/20 rounded-full shadow-sm">
                  {date}
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              {/* Jogos do dia */}
              <div className="grid gap-3 font-sans">
                {dayGames.map(game => (
                  <div key={game.id}
                    className="fgb-card bg-white p-5 flex items-center gap-6 hover:border-[var(--black)] transition-all group shadow-sm">

                    {/* Horário */}
                    <div className="text-center flex-shrink-0 w-16 group-hover:scale-105 transition-transform">
                      <p className="text-base font-black text-[var(--black)]">
                        {new Date(game.dateTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      <p className="text-[9px] text-[var(--verde)] font-black uppercase tracking-widest mt-0.5">Rodada {game.round || 1}</p>
                    </div>

                    {/* Divisor */}
                    <div className="w-px h-12 bg-[var(--border)]" />

                    {/* Confronto */}
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      {/* Mandante */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-black uppercase text-[var(--black)] truncate text-right">
                          {game.homeTeam.name}
                        </span>
                        <div className="w-9 h-9 rounded-2xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-inner">
                          {game.homeTeam.logoUrl ? (
                            <img src={game.homeTeam.logoUrl} className="w-full h-full rounded-2xl object-cover p-1" />
                          ) : (
                            <span className="text-[10px] font-black text-[var(--gray)]">
                              {game.homeTeam.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score / VS */}
                      <div className="flex-shrink-0 w-24 flex justify-center">
                        {game.status === 'FINISHED' ? (
                          <div className="flex items-center gap-2 bg-[var(--gray-l)] px-3 py-1 rounded-xl border border-[var(--border)]">
                            <span className="text-xl font-black text-[var(--black)] tabular-nums">{game.homeScore}</span>
                            <span className="text-[var(--gray)] font-black text-xs">×</span>
                            <span className="text-xl font-black text-[var(--black)] tabular-nums">{game.awayScore}</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1 rounded-full bg-[var(--gray-l)] border border-[var(--border)]">
                             <span className="text-[10px] font-black italic text-[var(--gray)] uppercase">vs</span>
                          </div>
                        )}
                      </div>

                      {/* Visitante */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 shadow-inner">
                          {game.awayTeam.logoUrl ? (
                            <img src={game.awayTeam.logoUrl} className="w-full h-full rounded-2xl object-cover p-1" />
                          ) : (
                            <span className="text-[10px] font-black text-[var(--gray)]">
                              {game.awayTeam.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-black uppercase text-[var(--black)] truncate">
                          {game.awayTeam.name}
                        </span>
                      </div>
                    </div>

                    {/* Divisor */}
                    <div className="w-px h-12 bg-[var(--border)]" />

                    {/* Categoria + Status + Ação */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0 w-32">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[var(--black)] bg-[var(--yellow)]/30 border border-[var(--orange)]/20 px-2 py-0.5 rounded-full">
                        {game.category.name}
                      </span>
                      {game.status === 'FINISHED' ? (
                        <div className="flex flex-col gap-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-2 h-2" /> Encerrado
                          </span>
                          <GenerateSumulaButton gameId={game.id} />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <RegisterResultButton gameId={game.id} />
                          <GenerateSumulaButton gameId={game.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
