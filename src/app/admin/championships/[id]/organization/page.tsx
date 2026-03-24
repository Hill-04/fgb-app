import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Sparkles, Users, Calendar, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react'
import { AISchedulingButton } from '../AISchedulingButton'

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      minTeamsPerCat: true,
      hasPlayoffs: true,
      startDate: true,
      endDate: true
    }
  })

  const categoriesWithTeams = await prisma.championshipCategory.findMany({
    where: { championshipId: id },
    include: {
      _count: {
        select: {
          registrations: {
            where: { registration: { status: 'CONFIRMED' } }
          }
        }
      },
      games: {
        where: { phase: 1 },
        take: 1,
        select: { id: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  if (!championship) return <div>Campeonato não encontrado</div>

  const minTeams = championship.minTeamsPerCat || 3

  const categoriesReady = categoriesWithTeams.filter(
    cat => cat._count.registrations >= minTeams
  )
  const allReady = categoriesReady.length === categoriesWithTeams.length
  
  const categoriesMissing = categoriesWithTeams.filter(cat => cat._count.registrations < minTeams)

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-[#0A0A0A] p-8 rounded-[32px] border border-white/5">
        <div>
          <h2 className="text-4xl font-black italic uppercase text-white tracking-tight">
            Organização
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-2">
            Logística, Calendário e Viabilidade por Categoria
          </p>
        </div>
        
        {allReady ? (
          <AISchedulingButton
            championshipId={id}
            championshipName={championship.name}
          />
        ) : (
          <div className="flex items-center gap-3 px-6 h-12 bg-white/[0.02] border border-white/[0.08] rounded-2xl opacity-60 backdrop-blur-sm cursor-not-allowed">
            <Sparkles className="w-4 h-4 text-slate-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
              Gerador IA Bloqueado
            </span>
          </div>
        )}
      </div>

      {/* Alerta de Viabilidade */}
      {!allReady && (
        <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/10 rounded-[28px] p-8 flex flex-col md:flex-row items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center flex-shrink-0 border border-[#FF6B00]/20">
            <AlertTriangle className="w-6 h-6 text-[#FF6B00]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF6B00] mb-2">
              Ação Requerida: Categorias Incompletas
            </p>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              O agendamento automático está bloqueado pois {categoriesMissing.length} categoria(s) ainda não atingiram o mínimo de {minTeams} equipes confirmadas.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
               {categoriesMissing.map(cat => (
                 <span key={cat.id} className="text-[9px] font-black uppercase px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-slate-500">
                    {cat.name}: falta {minTeams - cat._count.registrations}
                 </span>
               ))}
            </div>
          </div>
          <Link
            href={`/admin/championships/${id}/registrations`}
            className="px-6 h-11 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 whitespace-nowrap"
          >
            Gerenciar Inscrições <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriesWithTeams.map(cat => {
          const count = cat._count.registrations
          const ready = count >= minTeams
          const hasGames = cat.games.length > 0
          const pct = Math.min(100, Math.round((count / minTeams) * 100))

          return (
            <div
              key={cat.id}
              className={`bg-[#0F0F0F] border rounded-[32px] p-8 transition-all group ${
                ready ? 'border-green-500/20 hover:border-green-500/40' : 'border-white/5 hover:border-[#FF6B00]/20'
              }`}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                  <p className="text-xl font-black italic uppercase text-white tracking-tight group-hover:text-[#FF6B00] transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Categoria Oficial</p>
                </div>
                {hasGames ? (
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                  </div>
                ) : ready ? (
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/20">
                    <Users className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Users className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Equipes Confirmadas
                      </span>
                      <span className={`text-lg font-black ${ready ? 'text-green-500' : 'text-[#FF6B00]'}`}>
                        {count} <span className="text-slate-700 text-xs">/ {minTeams}</span>
                      </span>
                   </div>
                   <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${ready ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-[#FF6B00] shadow-[0_0_10px_rgba(255,107,0,0.3)]'}`}
                        style={{ width: `${pct}%` }}
                      />
                   </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Estado</span>
                      <span className={`text-[10px] font-black uppercase mt-1 ${
                        hasGames ? 'text-green-400' : ready ? 'text-[#FF6B00]' : 'text-slate-500'
                      }`}>
                         {hasGames ? '✓ Organizado' : ready ? 'Ready to IA' : 'Aguardando'}
                      </span>
                   </div>
                   {hasGames && (
                      <Link
                        href={`/admin/championships/${id}/matches`}
                        className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-1.5 bg-white/5 px-4 h-8 rounded-lg transition-all"
                      >
                         Jogos <Calendar className="w-3 h-3 text-[#FF6B00]" />
                      </Link>
                   )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
