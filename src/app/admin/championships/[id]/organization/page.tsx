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
    <div className="space-y-8 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-[var(--gray-l)] p-8 rounded-[32px] border border-[var(--border)]">
        <div>
          <h2 className="fgb-display text-4xl text-[var(--black)] leading-none">
            Organização
          </h2>
          <p className="fgb-label text-[var(--gray)] mt-2" style={{ fontSize: 10, letterSpacing: 2 }}>
            Logística, Calendário e Viabilidade por Categoria
          </p>
        </div>
        
        {allReady ? (
          <AISchedulingButton
            championshipId={id}
            championshipName={championship.name}
          />
        ) : (
          <div className="flex items-center gap-3 px-6 h-12 bg-white border border-[var(--border)] rounded-2xl opacity-60 backdrop-blur-sm cursor-not-allowed">
            <Sparkles className="w-4 h-4 text-[var(--gray)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">
              Gerador IA Bloqueado
            </span>
          </div>
        )}
      </div>

      {/* Alerta de Viabilidade */}
      {!allReady && (
        <div className="bg-orange-50 border border-orange-200 rounded-[28px] p-8 flex flex-col md:flex-row items-start md:items-center gap-6 animate-in fade-in slide-in-from-top-2 duration-500 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0 border border-orange-300">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-2">
              Ação Requerida: Categorias Incompletas
            </p>
            <p className="text-sm text-[var(--gray)] font-medium leading-relaxed">
              O agendamento automático está bloqueado pois {categoriesMissing.length} categoria(s) ainda não atingiram o mínimo de {minTeams} equipes confirmadas.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
               {categoriesMissing.map(cat => (
                 <span key={cat.id} className="text-[9px] font-black uppercase px-3 py-1 bg-white border border-[var(--border)] rounded-lg text-orange-600 shadow-sm">
                    {cat.name}: falta {minTeams - cat._count.registrations}
                 </span>
               ))}
            </div>
          </div>
          <Link
            href={`/admin/championships/${id}/registrations`}
            className="px-6 h-11 bg-white border border-[var(--border)] hover:bg-[var(--amarelo)] hover:border-[#E66000] text-[var(--black)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
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
              className={`fgb-card bg-white p-8 transition-all group ${
                ready ? 'border-green-200 hover:border-green-400 shadow-sm' : 'hover:border-orange-200'
              }`}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-1">
                  <p className="fgb-display text-xl text-[var(--black)] leading-none group-hover:text-green-600 transition-colors">
                    {cat.name}
                  </p>
                  <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10, letterSpacing: 2 }}>Categoria Oficial</p>
                </div>
                {hasGames ? (
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center border border-green-200">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                ) : ready ? (
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-200">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[var(--gray-l)] flex items-center justify-center border border-[var(--border)]">
                    <Users className="w-5 h-5 text-[var(--gray)]" />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black text-[var(--gray)] uppercase tracking-widest">
                        Equipes Confirmadas
                      </span>
                      <span className={`text-lg font-black ${ready ? 'text-green-600' : 'text-orange-600'}`}>
                        {count} <span className="text-slate-400 text-xs">/ {minTeams}</span>
                      </span>
                   </div>
                   <div className="h-2 bg-[var(--gray-l)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${ready ? 'bg-[var(--verde)] shadow-sm' : 'bg-[var(--amarelo)]'}`}
                        style={{ width: `${pct}%` }}
                      />
                   </div>
                </div>

                <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-[var(--gray)] uppercase tracking-widest">Estado</span>
                      <span className={`text-[10px] font-black uppercase mt-1 ${
                        hasGames ? 'text-green-600' : ready ? 'text-orange-600' : 'text-[var(--gray)]'
                      }`}>
                         {hasGames ? '✓ Organizado' : ready ? 'Ready to IA' : 'Aguardando'}
                      </span>
                   </div>
                   {hasGames && (
                      <Link
                        href={`/admin/championships/${id}/matches`}
                        className="text-[9px] font-black uppercase tracking-widest text-[var(--black)] hover:bg-[var(--amarelo)] hover:border-[#E66000] border border-[var(--border)] flex items-center gap-1.5 bg-[var(--gray-l)] px-4 h-8 rounded-lg transition-all shadow-sm"
                      >
                         Jogos <Calendar className="w-3 h-3 text-[var(--black)]" />
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
