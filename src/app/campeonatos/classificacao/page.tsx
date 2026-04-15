import { Metadata } from 'next'
import Image from 'next/image'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { getActiveSeason } from '@/lib/queries/seasons'
import { getStandings } from '@/lib/queries/standings'

export const metadata: Metadata = {
  title: 'Classificação — FGB',
  description: 'Tabela de Classificação do Campeonato Gaúcho.',
}

export default async function ClassificacaoPage() {
  const activeSeasonData = await getActiveSeason().catch(() => null)
  const activeSeason: any = activeSeasonData
  
  let standings: any[] = []

  if (activeSeason) {
    standings = await getStandings(activeSeason.id).catch(() => [])
  }

  return (
    <div className="bg-[#F7F8F4] min-h-screen">
      <PublicHeader />

      <div className="fgb-page-header-premium">
        <div className="bg-text">LEADERBOARD</div>
        <div className="max-w-4xl mx-auto px-4 relative text-center content">
          <div className="fgb-label" style={{ color: 'var(--yellow)', marginBottom: 12 }}>
            Temporada {activeSeason?.name ?? 'Atual'}
          </div>
          <h1 className="fgb-display fgb-h1 mb-4">Classificação</h1>
          <p className="font-body text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
            Confira a tabela de pontuação, aproveitamento e resultados acumulados das equipes.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-14">
        
        <div className="fgb-card bg-white overflow-hidden shadow-sm border border-slate-200">
           <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="fgb-display text-2xl">Standings</h3>
           </div>
           
           <div className="overflow-x-auto fgb-hide-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                 <thead>
                    <tr className="bg-white fgb-label text-[10px] text-slate-400 border-b border-slate-200">
                       <th className="py-4 px-6 w-16 text-center">POS</th>
                       <th className="py-4 px-4 w-12 text-center"></th>
                       <th className="py-4 px-2">Equipe</th>
                       <th className="py-4 px-2 text-center text-slate-800" title="Pontos Classificatórios">PTS</th>
                       <th className="py-4 px-2 text-center" title="Jogos Disputados">J</th>
                       <th className="py-4 px-2 text-center" title="Vitórias">V</th>
                       <th className="py-4 px-2 text-center" title="Derrotas">D</th>
                       <th className="py-4 px-2 text-center text-[var(--verde)]" title="Aproveitamento %">%APV</th>
                       <th className="py-4 px-2 text-center text-slate-300" title="Pontos Feitos">PF</th>
                       <th className="py-4 px-2 text-center text-slate-300" title="Pontos Sofridos">PS</th>
                       <th className="py-4 px-2 text-center text-slate-300" title="Saldo de Pontos">S</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm font-medium">
                    {standings.map((team, index) => {
                       const pos = index + 1
                       const isPlayoffZone = pos <= 8 // Simulação de zona verde
                       
                       return (
                          <tr key={team.team_id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                             <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full fgb-display text-base ${isPlayoffZone ? 'bg-[var(--vercel-dark)] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                   {pos}
                                </span>
                             </td>
                             <td className="py-4 px-4 text-center">
                                {team.logo_url ? (
                                   <div className="w-8 h-8 relative rounded-full overflow-hidden border border-slate-200 shadow-sm mx-auto">
                                      <Image src={team.logo_url} alt={team.team_short} fill className="object-cover" unoptimized/>
                                   </div>
                                ) : (
                                   <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-[10px] font-bold text-slate-400 fgb-display border border-slate-200">
                                      {team.short_name?.substring(0,3) || 'TEAM'}
                                   </div>
                                )}
                             </td>
                             <td className="py-4 px-2">
                                <div className="font-bold flex flex-col">
                                   <span className="text-slate-800 text-[15px]">{team.team_name}</span>
                                   <span className="fgb-label text-[10px] text-slate-400 mt-1">{team.short_name}</span>
                                </div>
                             </td>
                             <td className="py-4 px-2 text-center fgb-display text-lg">{team.points}</td>
                             <td className="py-4 px-2 text-center text-slate-500">{team.games_played}</td>
                             <td className="py-4 px-2 text-center text-green-600 font-bold">{team.wins}</td>
                             <td className="py-4 px-2 text-center text-red-600 font-bold">{team.losses}</td>
                             <td className="py-4 px-2 text-center font-bold text-[var(--verde)] bg-green-50/50">{team.win_pct}%</td>
                             <td className="py-4 px-2 text-center text-slate-400 text-xs font-mono">{team.pts_for}</td>
                             <td className="py-4 px-2 text-center text-slate-400 text-xs font-mono">{team.pts_against}</td>
                             <td className="py-4 px-2 text-center text-slate-500 text-xs font-mono font-bold">{team.pts_for - team.pts_against > 0 ? '+' : ''}{team.pts_for - team.pts_against}</td>
                          </tr>
                       )
                    })}
                    {standings.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-16 text-center text-slate-400 font-normal text-sm">
                           Nenhuma equipe registrou jogos ainda na classificação.
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
           
           <div className="p-4 bg-slate-50 border-t border-slate-200 fgb-label text-[10px] text-slate-400 flex gap-6">
              <span>Classificação gerada oficialmente via Súmula</span>
           </div>
        </div>

      </main>

      <PublicFooter />
    </div>
  )
}
