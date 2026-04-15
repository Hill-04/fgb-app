import { Metadata } from 'next'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { getActiveSeason } from '@/lib/queries/seasons'
import { getGamesBySeasonId } from '@/lib/queries/games'

export const metadata: Metadata = {
  title: 'Jogos — FGB',
  description: 'Confira todos os jogos oficiais do basquete gaúcho.',
}

export default async function JogosPage() {
  const activeSeasonData = await getActiveSeason().catch(() => null)
  const activeSeason: any = activeSeasonData;
  let games: any[] = []

  if (activeSeason) {
    games = await getGamesBySeasonId(activeSeason.id).catch(() => [])
  }

  // Separar jogos por status
  const liveGames = games.filter((g: any) => g.status === 'live')
  const scheduledGames = games.filter((g: any) => g.status === 'scheduled')
  const finishedGames = games.filter((g: any) => g.status === 'finished')

  return (
    <div className="bg-[#F7F8F4] min-h-screen">
      <PublicHeader />

      <div className="fgb-page-header-premium">
        <div className="bg-text">JOGOS</div>
        <div className="max-w-4xl mx-auto px-4 relative text-center content">
          <div className="fgb-label" style={{ color: 'var(--yellow)', marginBottom: 12 }}>
            Temporada {activeSeason?.name ?? 'Atual'}
          </div>
          <h1 className="fgb-display fgb-h1 mb-4">Calendário Oficial</h1>
          <p className="font-body text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
            Acompanhe o portal de resultados e tabelas. Clique em um jogo encerrado para visualizar o box score detalhado.
          </p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-14">

        {liveGames.length > 0 && (
          <section className="mb-14">
            <h2 className="fgb-display text-2xl mb-6 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--red)] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--red)]" />
              </span>
              AO VIVO AGORA
            </h2>
            <div className="grid gap-4">
              {liveGames.map((game: any) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {scheduledGames.length > 0 && (
          <section className="mb-14">
            <h2 className="fgb-display text-2xl mb-6">Próximos Jogos</h2>
            <div className="grid gap-4">
              {scheduledGames.map((game: any) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {finishedGames.length > 0 && (
          <section className="mb-14">
            <h2 className="fgb-display text-2xl mb-6">Resultados Recentes</h2>
            <div className="grid gap-4">
              {finishedGames.reverse().map((game: any) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}

        {games.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            Nenhum jogo cadastrado para esta temporada.
          </div>
        )}

      </main>

      <PublicFooter />
    </div>
  )
}

function GameCard({ game }: { game: any }) {
  const date = new Date(game.scheduled_at)
  const isFinished = game.status === 'finished'

  return (
    <Link href={`/jogos/${game.id}`} className="block">
      <div className="fgb-card bg-white p-6 hover:-translate-y-1 transition-transform border border-slate-200 cursor-pointer relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="text-sm font-semibold text-slate-500 md:w-32 flex-shrink-0">
            <div>{date.toLocaleDateString('pt-BR')}</div>
            <div className="text-slate-400">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            {game.venue && <div className="text-xs uppercase mt-2 font-normal truncate opacity-60 tracking-wider font-mono">{game.venue}</div>}
          </div>

          <div className="flex items-center gap-4 flex-1 justify-center">
            <div className="text-right flex-1">
              <h3 className="fgb-display text-lg md:text-xl">{game.home_team?.name}</h3>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl text-2xl relative font-bold min-w-24 justify-center whitespace-nowrap">
               {(game.home_score !== null) ? (
                 <>
                   <span className={game.home_score > game.away_score ? "text-green-700" : ""}>{game.home_score}</span>
                   <span className="text-slate-300 text-sm">×</span>
                   <span className={game.away_score > game.home_score ? "text-green-700" : ""}>{game.away_score}</span>
                 </>
               ) : (
                 <span className="text-slate-400 text-base py-1 uppercase tracking-widest font-mono">VS</span>
               )}
            </div>

            <div className="text-left flex-1">
              <h3 className="fgb-display text-lg md:text-xl">{game.away_team?.name}</h3>
            </div>
          </div>

          <div className="md:w-32 text-right flex-shrink-0">
             {isFinished ? (
                <span className="inline-block bg-[var(--yellow)] text-black px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg group-hover:bg-black group-hover:text-white transition-colors border border-[rgba(0,0,0,0.1)] shadow-sm">
                   Súmula →
                </span>
             ) : (
                <span className="fgb-badge-verde opacity-50 bg-slate-200 text-slate-600">
                   Aguardando
                </span>
             )}
          </div>

        </div>
        
        <div className="absolute top-0 right-0 h-full w-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-right fgb-stripe p-0 m-0 w-2" />
      </div>
    </Link>
  )
}
