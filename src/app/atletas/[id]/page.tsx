import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PublicHeader } from '@/components/PublicHeader'
import { PublicFooter } from '@/components/PublicFooter'
import { getAthleteStats } from '@/lib/queries/stats'
import { getActiveSeason } from '@/lib/queries/seasons'

type Props = { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const activeSeasonData = await getActiveSeason().catch(() => null)
  const activeSeasonAny: any = activeSeasonData
  if (!activeSeasonAny) return { title: 'Atleta | FGB' }

  try {
    const statDataResult = await getAthleteStats(params.id, activeSeasonAny.id)
    const statData: any = statDataResult;
    if (!statData) throw new Error()
    return {
      title: `${statData.athlete_name} — Perfil do Atleta | FGB`,
      description: `Estatísticas e perfil de ${statData.athlete_name} da equipe ${statData.team_name}.`,
    }
  } catch(e) {
     return { title: 'Atleta | FGB' }
  }
}

export default async function AthleteProfilePage({ params }: Props) {
  const activeSeasonData = await getActiveSeason().catch(() => null)
  const activeSeason: any = activeSeasonData
  if (!activeSeason) notFound()

  let statData;
  try {
     statData = await getAthleteStats(params.id, activeSeason.id)
  } catch (e) {
     notFound()
  }

  const athlete: any = statData
  if (!athlete) notFound()

  return (
    <div className="bg-slate-50 min-h-screen">
      <PublicHeader />

      {/* HERO DO ATLETA */}
      <div className="bg-[var(--vercel-dark)] text-white relative overflow-hidden pt-12 pb-24">
        <div className="absolute inset-0 bg-[url('https://basquetegaucho.com.br/wp-content/uploads/2023/09/Federacao-Gaucha-de-Basketball-Logo-01.png')] bg-no-repeat bg-center opacity-5 pointer-events-none scale-150" />
        
        <div className="max-w-6xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-12">
          
          <div className="w-48 h-48 md:w-64 md:h-64 bg-slate-800 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl flex-shrink-0 relative">
             {athlete.photo_url ? (
                <Image src={athlete.photo_url} alt={athlete.athlete_name} fill className="object-cover" unoptimized/>
             ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20 fgb-display text-8xl">
                   {athlete.athlete_name?.substring(0,1) || 'A'}
                </div>
             )}
             <div className="absolute bottom-4 right-4 bg-[var(--verde)] text-white w-12 h-12 rounded-full flex items-center justify-center fgb-display text-2xl shadow-lg border-2 border-white/20">
                {athlete.jersey_number ?? '-'}
             </div>
          </div>

          <div className="text-center md:text-left flex-1">
             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <span className="fgb-badge-verde bg-white/10 text-white border-none">{athlete.team_name}</span>
                <span className="fgb-badge-verde bg-[var(--yellow)] text-black border-none px-3">{athlete.position ?? 'ATLETA'}</span>
             </div>
             
             <h1 className="fgb-display text-5xl md:text-7xl mb-2">{athlete.athlete_name}</h1>
             {athlete.nickname && (
                <div className="text-xl text-white/60 font-body mb-8 italic">"{athlete.nickname}"</div>
             )}

             <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 mt-6">
                <StatBox label="Jogos" value={athlete.games_played} />
                <div className="w-px h-10 bg-white/10" />
                <StatBox label="Minutos" value={(athlete.avg_minutes || 0).toFixed(1)} />
                <div className="w-px h-10 bg-white/10" />
                <StatBox label="Eficiência" value={(athlete.avg_efficiency || 0).toFixed(1)} highlight />
             </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12 -mt-16 relative z-20">
        
        {/* CARDS DE ESTATÍSTICA DE ÉPOCA */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
           <HighlightCard title="Pontos / Jogo" value={(athlete.avg_points || 0).toFixed(1)} />
           <HighlightCard title="Rebotes / Jogo" value={(athlete.avg_rebounds || 0).toFixed(1)} />
           <HighlightCard title="Assistências / J" value={(athlete.avg_assists || 0).toFixed(1)} />
           <HighlightCard title="Roubos / Jogo" value={(athlete.avg_steals || 0).toFixed(1)} />
        </div>

        {/* DETALHAMENTO TÉCNICO */}
        <div className="fgb-card bg-white p-8 md:p-12 shadow-sm border border-slate-200">
           <h3 className="fgb-display text-2xl mb-8 border-b border-slate-100 pb-4">Detalhamento Técnico</h3>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              
              <div>
                 <h4 className="fgb-label text-slate-400 mb-6">Aproveitamento</h4>
                 <div className="space-y-6">
                    <ProgressBar label="Arremessos de Quadra (FG)" percentage={athlete.fg_pct} />
                    <ProgressBar label="Bolas de 3 Pontos (3PT)" percentage={athlete.three_pct} />
                    <ProgressBar label="Lances Livres (FT)" percentage={athlete.ft_pct} />
                 </div>
              </div>

              <div>
                 <h4 className="fgb-label text-slate-400 mb-6">Acumulado Total da Época</h4>
                 <div className="space-y-4">
                    <RowStat label="Total de Pontos" value={athlete.total_points} />
                    <RowStat label="Rebotes Totais" value={athlete.total_rebounds} />
                    <RowStat label="Assistências Totais" value={athlete.total_assists} />
                    <RowStat label="Enterradas" value={athlete.total_dunks} />
                    <RowStat label="Double-Doubles" value={athlete.double_doubles} />
                 </div>
              </div>

              <div>
                 <h4 className="fgb-label text-slate-400 mb-6">Recordes Pessoais (Seas.)</h4>
                 <div className="space-y-4">
                    <RowStat label="Máx Pontos" value={athlete.record_points} highlight />
                    <RowStat label="Máx Rebotes" value={athlete.record_rebounds} highlight />
                    <RowStat label="Máx Assistências" value={athlete.record_assists} highlight />
                 </div>
              </div>

           </div>
        </div>

      </main>

      <PublicFooter />
    </div>
  )
}

function StatBox({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
   return (
      <div className="text-center md:text-left">
         <div className={`fgb-display text-3xl md:text-4xl leading-none ${highlight ? 'text-[var(--verde)]' : 'text-white'}`}>{value}</div>
         <div className="fgb-label text-[10px] text-white/50 mt-1 tracking-widest">{label}</div>
      </div>
   )
}

function HighlightCard({ title, value }: { title: string, value: string | number }) {
   return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
         <div className="fgb-display text-4xl mb-2 text-slate-800">{value}</div>
         <div className="fgb-label text-[9px] text-slate-400 tracking-widest leading-tight">{title}</div>
      </div>
   )
}

function ProgressBar({ label, percentage }: { label: string, percentage: number }) {
   return (
      <div>
         <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
            <span>{label}</span>
            <span>{percentage}%</span>
         </div>
         <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--yellow)] rounded-full" style={{ width: `${percentage}%` }} />
         </div>
      </div>
   )
}

function RowStat({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) {
   return (
      <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 relative">
         <span className="text-sm text-slate-500 font-medium">{label}</span>
         <span className={`fgb-display text-xl ${highlight ? 'text-[var(--verde)]' : 'text-slate-800'}`}>{value}</span>
      </div>
   )
}
