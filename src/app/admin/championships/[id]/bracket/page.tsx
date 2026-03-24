import { prisma } from '@/lib/db'
import { AlertCircle } from 'lucide-react'

export default async function BracketPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    select: { hasPlayoffs: true, playoffTeams: true, name: true }
  })

  if (!championship?.hasPlayoffs) {
    return (
      <div className="bg-[#141414] border border-white/[0.08] rounded-[40px] p-16 text-center animate-in zoom-in-95 duration-700">
        <div className="w-20 h-20 rounded-[32px] bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/10 group">
          <AlertCircle className="w-10 h-10 text-slate-500 group-hover:text-white transition-colors" />
        </div>
        <h3 className="text-2xl font-black italic uppercase text-white tracking-tight mb-3">
          Playoffs Desativados
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
          Este campeonato está configurado para fase única ou não possui fase de eliminatórias.
        </p>
      </div>
    )
  }

  // Buscar categorias e standings
  const categories = await prisma.championshipCategory.findMany({
    where: { championshipId: id },
    include: {
      standings: {
        orderBy: [{ points: 'desc' }, { wins: 'desc' }],
        take: championship.playoffTeams || 8,
        include: { team: { select: { name: true, logoUrl: true } } }
      },
      games: {
        where: { phase: { gt: 1 } },
        include: {
          homeTeam: { select: { name: true, logoUrl: true } },
          awayTeam: { select: { name: true, logoUrl: true } }
        },
        orderBy: { dateTime: 'asc' }
      }
    }
  })

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black italic uppercase text-white tracking-tight">
            Chaveamento (Bracket)
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">
            Projeção baseada nos top {championship.playoffTeams} de cada categoria
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {categories.map(cat => (
          <div key={cat.id} className="bg-[#0A0A0A] border border-white/[0.08] rounded-[40px] p-8 overflow-hidden relative shadow-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6B00]/40 to-transparent" />
            
            <div className="flex items-center gap-3 mb-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6B00]">Categoria</span>
              <h3 className="text-lg font-black italic uppercase text-white tracking-tight">
                {cat.name}
              </h3>
            </div>

            {cat.standings.length === 0 ? (
              <div className="py-12 text-center bg-white/[0.02] rounded-3xl border border-white/5">
                <p className="text-xs text-slate-600 italic font-medium">Aguardando definição dos times nos standings da fase regular</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="flex gap-12 min-w-max items-center">

                  {/* Quartas de Final */}
                  <div className="flex flex-col gap-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-2 border-l-2 border-[#FF6B00] pl-3">
                      {(championship.playoffTeams || 8) >= 8 ? 'Quartas de Final' : 'Semifinal'}
                    </p>
                    {cat.standings.reduce((pairs: any[], team, i) => {
                      if (i < (championship.playoffTeams / 2)) {
                        pairs.push([team, cat.standings[championship.playoffTeams - 1 - i]])
                      }
                      return pairs
                    }, []).map((pair, i) => (
                      <div key={i} className="flex flex-col gap-1.5 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden w-52 shadow-lg shadow-black group">
                          {/* Primeiro Time */}
                          <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.04] bg-white/[0.02] group-hover:bg-white/[0.04] transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                               <span className="text-[9px] font-black text-[#FF6B00] w-5">{i*2+1}°</span>
                               <span className="text-[11px] font-black text-white truncate uppercase">{pair[0]?.team?.name || 'TBD'}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-600">--</span>
                          </div>
                          {/* Segundo Time */}
                          <div className="px-4 py-3 flex items-center justify-between group-hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                               <span className="text-[9px] font-black text-slate-600 w-5">{championship.playoffTeams - i}°</span>
                               <span className="text-[11px] font-black text-slate-400 truncate uppercase">{pair[1]?.team?.name || 'TBD'}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-800">--</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Linhas de Conexão 1 */}
                  <div className="flex flex-col justify-around h-full py-10 opacity-30">
                    {Array.from({ length: Math.ceil(championship.playoffTeams / 4) }).map((_, i) => (
                      <div key={i} className="w-12 h-20 border-y border-r border-white/20 rounded-r-3xl" />
                    ))}
                  </div>

                  {/* Semifinal */}
                  <div className="flex flex-col justify-around gap-12 h-full py-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-2 border-l-2 border-[#FF6B00] pl-3">
                      Semifinais
                    </p>
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="bg-[#141414] border border-white/[0.06] rounded-2xl overflow-hidden w-52 shadow-lg shadow-black group">
                        <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                          <span className="text-[10px] font-black text-slate-600 italic uppercase tracking-widest">Vencedor Q{i*2+1}</span>
                        </div>
                        <div className="px-4 py-3">
                          <span className="text-[10px] font-black text-slate-600 italic uppercase tracking-widest">Vencedor Q{i*2+2}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Linha Conexão 2 */}
                  <div className="flex items-center opacity-30">
                    <div className="w-12 h-40 border-y border-r border-white/20 rounded-r-3xl" />
                  </div>

                  {/* Grande Final */}
                  <div className="flex flex-col justify-center gap-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6B00] mb-2 border-l-2 border-[#FF6B00] pl-3">
                      Grande Final
                    </p>
                    <div className="bg-gradient-to-br from-[#FF6B00]/20 to-transparent border border-[#FF6B00]/30 rounded-3xl overflow-hidden w-52 shadow-2xl shadow-orange-600/10 relative">
                       <div className="absolute top-0 right-0 p-2">
                          <div className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                       </div>
                      <div className="px-4 py-5 border-b border-[#FF6B00]/10">
                        <span className="text-[10px] font-black text-white/50 italic uppercase tracking-widest">Finalista 01</span>
                      </div>
                      <div className="px-4 py-5">
                        <span className="text-[10px] font-black text-white/50 italic uppercase tracking-widest">Finalista 02</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
