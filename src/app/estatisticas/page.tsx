import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { getActiveSeason } from '@/lib/queries/seasons'
import { getTopScorers, getTopRebounders } from '@/lib/queries/stats'

export const metadata: Metadata = {
  title: 'Líderes Estatísticos — FGB',
  description: 'Os melhores atletas do campeonato gaúcho de basketball.',
}

export default async function EstatisticasPage() {
  const activeSeasonData = await getActiveSeason()
  const activeSeason: any = activeSeasonData
  
  let scorers: any[] = []
  let rebounders: any[] = []

  if (activeSeason) {
    scorers = await getTopScorers(activeSeason.id, 5)
    rebounders = await getTopRebounders(activeSeason.id, 5)
  }

  return (
    <div className="bg-[#F7F8F4] min-h-screen">
      <PublicHeader />

      <div className="fgb-page-header-premium">
        <div className="bg-text">LEADERS</div>
        <div className="max-w-4xl mx-auto px-4 relative text-center content">
          <div className="fgb-label" style={{ color: 'var(--yellow)', marginBottom: 12 }}>
            Temporada {activeSeason?.name ?? 'Atual'}
          </div>
          <h1 className="fgb-display fgb-h1 mb-4">Estatísticas Inidividuais</h1>
          <p className="font-body text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
            Acompanhe a corrida pelo título de cestinha, maior reboteiro e líderes gerais da liga.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-14">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* CESTINHAS */}
            <section>
               <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
                  <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-2xl flex items-center justify-center font-bold text-xl fgb-display">
                     PT
                  </div>
                  <div>
                     <h2 className="fgb-display text-3xl">Cestinhas</h2>
                     <div className="fgb-label text-[10px] text-slate-400">PONTOS POR JOGO (PPG)</div>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  {scorers.map((athlete, index) => (
                     <LeaderCard 
                        key={athlete.athlete_id} 
                        athlete={athlete} 
                        rank={index + 1} 
                        statValue={athlete.avg_points.toFixed(1)} 
                        statLabel="PPG" 
                     />
                  ))}
                  {scorers.length === 0 && (
                     <div className="p-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-2xl">
                        Nenhum jogo contabilizado.
                     </div>
                  )}
               </div>
            </section>

            {/* REBOTEIROS */}
            <section>
               <div className="flex items-center gap-4 mb-8 border-b border-slate-200 pb-4">
                  <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center font-bold text-xl fgb-display">
                     RB
                  </div>
                  <div>
                     <h2 className="fgb-display text-3xl">Reboteiros</h2>
                     <div className="fgb-label text-[10px] text-slate-400">REBOTES POR JOGO (RPG)</div>
                  </div>
               </div>

               <div className="flex flex-col gap-4">
                  {rebounders.map((athlete, index) => (
                     <LeaderCard 
                        key={athlete.athlete_id} 
                        athlete={athlete} 
                        rank={index + 1} 
                        statValue={athlete.avg_rebounds.toFixed(1)} 
                        statLabel="RPG" 
                     />
                  ))}
                  {rebounders.length === 0 && (
                     <div className="p-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-2xl">
                        Nenhum jogo contabilizado.
                     </div>
                  )}
               </div>
            </section>

        </div>

      </main>

      <PublicFooter />
    </div>
  )
}

function LeaderCard({ athlete, rank, statValue, statLabel }: { athlete: any, rank: number, statValue: string, statLabel: string }) {
   const isFirst = rank === 1;

   return (
      <Link href={`/atletas/${athlete.athlete_id}`}>
         <div className={`fgb-card bg-white p-4 border relative overflow-hidden group hover:-translate-y-1 transition-transform ${isFirst ? 'border-[var(--yellow)] shadow-lg' : 'border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-6 relative z-10">
               
               <div className={`w-10 text-center font-black fgb-display text-2xl ${isFirst ? 'text-[var(--yellow)]' : 'text-slate-300'}`}>
                  {rank}
               </div>

               <div className="w-14 h-14 bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow flex-shrink-0 relative">
                  {athlete.photo_url ? (
                     <Image src={athlete.photo_url} alt={athlete.athlete_name} fill className="object-cover" unoptimized/>
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-300 fgb-display text-xl">
                        {athlete.athlete_name.substring(0,1)}
                     </div>
                  )}
               </div>

               <div className="flex-1">
                  <h3 className={`fgb-display text-xl leading-tight ${isFirst ? 'text-black' : 'text-slate-700'}`}>{athlete.athlete_name}</h3>
                  <div className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                     <span className="truncate">{athlete.team_name}</span>
                     <span className="w-1 h-1 bg-slate-300 rounded-full" />
                     <span className="fgb-label text-[9px] translate-y-px">{athlete.games_played} Jogos</span>
                  </div>
               </div>

               <div className="text-right pl-4 border-l border-slate-100">
                  <div className={`fgb-display text-4xl leading-none ${isFirst ? 'text-[var(--verde)]' : 'text-black'}`}>
                     {statValue}
                  </div>
                  <div className="fgb-label text-[10px] text-slate-400 mt-1 tracking-widest">{statLabel}</div>
               </div>

            </div>
            
            {isFirst && (
               <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-yellow-50 to-transparent pointer-events-none" />
            )}
         </div>
      </Link>
   )
}
