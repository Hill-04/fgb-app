import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { getGameWithStats } from '@/lib/queries/games'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await getGameWithStats(params.id).catch(() => null)
    const game: any = response?.game;
    if (!game) throw new Error()
    return {
      title: `${game.home_team?.short_name || 'Home'} vs ${game.away_team?.short_name || 'Away'} — Box Score | FGB`,
      description: `Estatísticas completas da partida entre ${game.home_team?.name || 'Home'} e ${game.away_team?.name || 'Away'}.`,
    }
  } catch(e) {
     return { title: 'Súmula | FGB' }
  }
}

export default async function GameSumulaPage({ params }: Props) {
  let data: any;
  try {
     data = await getGameWithStats(params.id).catch(() => null)
  } catch (e) {
     notFound()
  }

  const { game, stats }: { game: any, stats: any[] } = data || {};
  if (!game) notFound()

  // Divide as estatísticas por time
  const homeStats = stats.filter((s: any) => s.team_id === game.home_team_id)
  const awayStats = stats.filter((s: any) => s.team_id === game.away_team_id)

  const date = new Date(game.scheduled_at)

  return (
    <div className="bg-slate-50 min-h-screen">
      <PublicHeader />

      {/* PLACAR GIGANTE PREMIUM */}
      <div className="bg-[var(--black)] text-white relative overflow-hidden pt-12 pb-16">
        <div className="fgb-stripe absolute top-0 w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <Link href="/jogos" className="inline-flex items-center text-slate-400 hover:text-white transition-colors text-sm font-semibold uppercase tracking-widest mb-10">
            ← Voltar aos Jogos
          </Link>

          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
             
             {/* HOME TEAM */}
             <div className="flex-1 text-center md:text-right">
                <h2 className="fgb-display text-4xl mb-2">{game.home_team?.name || 'Time Mandante'}</h2>
                <div className="fgb-label text-slate-500">{game.home_team?.city ?? 'Local'}</div>
             </div>

             {/* SCORE */}
             <div className="flex flex-col items-center justify-center min-w-48">
                <div className="fgb-badge-verde mb-4 tracking-widest px-4 py-1.5 opacity-80">
                   {game.status === 'finished' ? 'FINAL' : game.status === 'live' ? 'AO VIVO' : 'AGENDADO'}
                </div>
                <div className="flex items-center gap-6">
                   <span className={`fgb-display text-6xl ${game.home_score > game.away_score && game.status === 'finished' ? 'text-[var(--yellow)]' : 'text-white'}`}>
                      {game.home_score ?? '-'}
                   </span>
                   <span className="text-slate-600 font-bold fgb-display text-3xl mt-2">X</span>
                   <span className={`fgb-display text-6xl ${game.away_score > game.home_score && game.status === 'finished' ? 'text-[var(--yellow)]' : 'text-white'}`}>
                      {game.away_score ?? '-'}
                   </span>
                </div>
                <div className="fgb-label text-slate-500 mt-6 tracking-widest text-center" style={{ textTransform: 'none', fontSize: 11 }}>
                   {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                   {game.venue && <><br/>{game.venue}</>}
                </div>
             </div>

             {/* AWAY TEAM */}
             <div className="flex-1 text-center md:text-left">
                <h2 className="fgb-display text-4xl mb-2">{game.away_team?.name || 'Time Visitante'}</h2>
                <div className="fgb-label text-slate-500">{game.away_team?.city ?? 'Visitante'}</div>
             </div>

          </div>
        </div>
      </div>

      {/* BOX SCORE TABLES */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {stats.length > 0 ? (
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <BoxScoreTable team={game.home_team} stats={homeStats} isWinner={game.home_score > game.away_score} />
              <BoxScoreTable team={game.away_team} stats={awayStats} isWinner={game.away_score > game.home_score} />
           </div>
        ) : (
           <div className="fgb-card p-12 text-center text-slate-500 bg-white">
              Súmula estatística ainda não registrada para este jogo.
           </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}

function BoxScoreTable({ team, stats, isWinner }: { team: any, stats: any[], isWinner: boolean }) {
  // Ordenar por pontos
  const displayStats = [...stats].sort((a, b) => b.points - a.points)

  return (
    <div className="fgb-card bg-white overflow-hidden shadow-sm" style={{ borderTop: isWinner ? '4px solid var(--verde)' : '4px solid var(--slate-800)' }}>
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
         <h3 className="fgb-display text-2xl">{team?.name || 'Equipe'}</h3>
         {isWinner && <span className="fgb-badge-verde text-xs bg-[var(--verde)]">Vencedor</span>}
      </div>
      
      <div className="overflow-x-auto fgb-hide-scrollbar">
         <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
            <thead>
               <tr className="bg-white fgb-label text-[10px] text-slate-400 border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Atleta</th>
                  <th className="py-3 px-2 text-center" title="Pontos">PTS</th>
                  <th className="py-3 px-2 text-center" title="Rebotes Totais">REB</th>
                  <th className="py-3 px-2 text-center" title="Assistências">AST</th>
                  <th className="py-3 px-2 text-center" title="Tocos">BLK</th>
                  <th className="py-3 px-2 text-center" title="Roubos">STL</th>
                  <th className="py-3 px-2 text-center text-slate-300" title="Arremessos de Campo">FG</th>
                  <th className="py-3 px-2 text-center text-slate-300" title="Arremessos de 3">3PT</th>
                  <th className="py-3 px-4 text-center text-[var(--verde)]" title="Eficiência">EFF</th>
               </tr>
            </thead>
            <tbody className="text-sm font-medium">
               {displayStats.map((s, i) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                     <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">{s.athlete?.jersey_number ?? '-'}</td>
                     <td className="py-3 px-4 truncate max-w-48">
                        {s.athlete?.name || 'Atleta não identificado'}
                        {s.athlete?.position && <span className="text-[10px] text-slate-400 block font-normal uppercase tracking-wider mt-0.5">{s.athlete.position}</span>}
                     </td>
                     <td className="py-3 px-2 text-center font-bold text-black">{s.points}</td>
                     <td className="py-3 px-2 text-center text-slate-600">{s.rebounds_total}</td>
                     <td className="py-3 px-2 text-center text-slate-600">{s.assists}</td>
                     <td className="py-3 px-2 text-center text-slate-400">{s.blocks}</td>
                     <td className="py-3 px-2 text-center text-slate-400">{s.steals}</td>
                     <td className="py-3 px-2 text-center text-slate-400 font-normal text-xs">{s.fg_made}/{s.fg_attempted}</td>
                     <td className="py-3 px-2 text-center text-slate-400 font-normal text-xs">{s.three_made}/{s.three_attempted}</td>
                     <td className="py-3 px-4 text-center font-bold text-[var(--verde)]">{s.efficiency}</td>
                  </tr>
               ))}
               {displayStats.length === 0 && (
                 <tr>
                   <td colSpan={10} className="py-12 text-center text-slate-400 font-normal text-sm">
                      Nenhum atleta registrado.
                   </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  )
}
