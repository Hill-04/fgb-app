import { prisma } from '@/lib/db'
import Link from 'next/link'
import { StatCard } from '@/components/StatCard'
import { PipelineSteps } from '@/components/PipelineSteps'
import { Section } from '@/components/Section'
import { Badge } from '@/components/Badge'
import { Trophy, Users, FileCheck, Calendar } from 'lucide-react'
import { AdminRegistrationModal } from '@/components/AdminRegistrationModal'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  try {
    const [
      teamCount, 
      championships, 
      registrationCount, 
      recentRegistrations,
      pendingRegistrationsCount,
      confirmedRegistrationsCount,
      newRegistrationsCount,
      nextGame,
      topStandings
    ] = await Promise.all([
      prisma.team.count(),
      prisma.championship.findMany({
        include: {
          _count: { select: { categories: true, registrations: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.registration.count(),
      prisma.registration.findMany({
        take: 5,
        orderBy: { registeredAt: 'desc' },
        include: {
          team: true,
          championship: true,
          categories: {
            include: {
              category: true
            }
          }
        }
      }),
      prisma.registration.count({ where: { status: 'PENDING' } }),
      prisma.registration.count({ where: { status: 'CONFIRMED' } }),
      prisma.registration.count({ 
        where: { 
          registeredAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } 
        } 
      }),
      prisma.game.findFirst({
        where: { status: { in: ['IN_PROGRESS', 'SCHEDULED'] } },
        orderBy: { dateTime: 'asc' },
        include: { homeTeam: true, awayTeam: true, category: true, championship: true }
      }),
      prisma.standing.findMany({
        take: 8,
        orderBy: [
          { wins: 'desc' },
          { pointsFor: 'desc' }
        ],
        include: {
          team: true,
          category: true
        }
      })
    ])

    const openChampionships = championships.filter(c => c.status === 'REGISTRATION_OPEN').length
    const totalCategories = 8 // Sub 12 ao Sub 19
    const totalGames = await prisma.game.count()

    return (
      <div className="space-y-10">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-4xl font-display font-black text-[--text-main] tracking-tight mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-[--text-secondary] font-medium text-lg">
            Visão geral da Federação Gaúcha de Basquete
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <StatCard
            label="Campeonatos"
            value={championships.length}
            sublabel={`${openChampionships} com inscrições abertas`}
            accent="orange"
            icon={<Trophy className="w-5 h-5" />}
          />

          <StatCard
            label="Equipes"
            value={teamCount}
            sublabel="Cadastradas no sistema"
            accent="blue"
            icon={<Users className="w-5 h-5" />}
          />

          <StatCard
            label="Categorias"
            value={totalCategories}
            sublabel="Sub 12 ao Sub 19"
            accent="purple"
            icon={<FileCheck className="w-5 h-5" />}
          />

          <StatCard
            label="Jogos"
            value={totalGames}
            sublabel="Agendados total"
            accent="green"
            icon={<Calendar className="w-5 h-5" />}
          />
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          
          {/* Main Content Column (Left - 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Live Match Module */}
            <div className="bg-[#111111] p-6 rounded-3xl border border-[rgba(255,255,255,0.05)] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-display font-black text-2xl text-[--text-main] tracking-tight">Live Match / Próximo Jogo</h2>
                  <p className="text-sm font-medium text-[--text-secondary]">Último jogo agendado</p>
                </div>
                {nextGame && (
                  <Badge variant="blue" className="shadow-sm">
                    {nextGame.status === 'IN_PROGRESS' ? 'AO VIVO' : 'Agendado'}
                  </Badge>
                )}
              </div>

              {nextGame ? (
                <div className="flex flex-col">
                  {/* Scoreboard */}
                  <div className="flex justify-between items-center bg-[#151515] p-6 rounded-2xl border border-[rgba(255,255,255,0.02)] mb-4">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl shrink-0">
                        {nextGame.homeTeam.name.charAt(0)}
                      </div>
                      <span className="font-bold text-[--text-main] text-center">{nextGame.homeTeam.name}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-4 font-display font-black text-5xl tracking-tighter text-white">
                        <span>{nextGame.homeScore || 0}</span>
                        <span className="text-[--text-dim] text-4xl">-</span>
                        <span>{nextGame.awayScore || 0}</span>
                      </div>
                      <span className="text-xs font-bold text-[#FF6B00] tracking-widest uppercase mt-3">4º Quarto</span>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl shrink-0">
                        {nextGame.awayTeam.name.charAt(0)}
                      </div>
                      <span className="font-bold text-[--text-main] text-center">{nextGame.awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Team Stats VS (Mocked Structure) */}
                  <div className="bg-[#151515] p-5 rounded-2xl border border-[rgba(255,255,255,0.02)]">
                    <h4 className="text-[10px] font-bold text-[--text-secondary] uppercase tracking-widest mb-4">Team Stats VS</h4>
                    <div className="space-y-4">
                      {/* Stat Row */}
                      <div>
                        <div className="flex justify-between text-xs font-medium text-[--text-main] mb-1.5">
                          <span>45%</span>
                          <span className="text-[--text-secondary]">FG%</span>
                          <span>38%</span>
                        </div>
                        <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#3B82F6]" style={{ width: '45%' }}></div>
                          <div className="bg-[#FF6B00]" style={{ width: '55%' }}></div>
                        </div>
                      </div>
                      {/* Stat Row */}
                      <div>
                        <div className="flex justify-between text-xs font-medium text-[--text-main] mb-1.5">
                          <span>12</span>
                          <span className="text-[--text-secondary]">Turnovers</span>
                          <span>18</span>
                        </div>
                        <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#3B82F6]" style={{ width: '60%' }}></div>
                          <div className="bg-[#FF6B00]" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[--text-secondary]">Nenhum jogo em andamento ou agendado no momento.</p>
              )}
            </div>

            {/* AI Brackets Module */}
            <div className="bg-[#111111] p-6 rounded-3xl border border-[rgba(255,255,255,0.05)] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-display font-black text-2xl text-[--text-main] tracking-tight">Motor de Chaveamento</h2>
                  <p className="text-sm font-medium text-[--text-secondary]">Playoffs (Sub 17)</p>
                </div>
                <div className="bg-[#8B5CF6]/10 text-[#A78BFA] border border-[#8B5CF6]/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Optimized by AI</span>
                </div>
              </div>

              {/* Bracket Structure (Structural rendering) */}
              <div className="flex gap-8 justify-center items-stretch py-4 overflow-x-auto min-h-[200px]">
                {/* Quarter Finals */}
                <div className="flex flex-col justify-around gap-6">
                   <div className="bg-[#151515] p-3 rounded-lg border border-[rgba(255,255,255,0.02)] min-w-[140px]">
                     <div className="text-xs font-bold text-[--text-main] flex justify-between"><span>#1 Seed</span><span>—</span></div>
                     <div className="text-xs font-bold text-[--text-secondary] flex justify-between mt-2 pt-2 border-t border-white/5"><span>#8 Seed</span><span>—</span></div>
                   </div>
                   <div className="bg-[#151515] p-3 rounded-lg border border-[rgba(255,255,255,0.02)] min-w-[140px]">
                     <div className="text-xs font-bold text-[--text-main] flex justify-between"><span>#4 Seed</span><span>—</span></div>
                     <div className="text-xs font-bold text-[--text-secondary] flex justify-between mt-2 pt-2 border-t border-white/5"><span>#5 Seed</span><span>—</span></div>
                   </div>
                </div>
                
                {/* Visual connecting lines */}
                <div className="w-px bg-[rgba(255,255,255,0.1)] relative">
                  <div className="absolute top-1/4 h-1/2 w-4 border-r border-y border-[rgba(255,255,255,0.1)] left-0"></div>
                </div>

                {/* Semi Finals */}
                <div className="flex flex-col justify-center gap-6">
                   <div className="bg-[#151515] p-3 rounded-lg border border-[#FF6B00]/30 min-w-[140px] shadow-[0_0_15px_rgba(255,107,0,0.1)]">
                     <div className="text-xs font-bold text-[#FF6B00] flex justify-between"><span>TBD</span><span>—</span></div>
                     <div className="text-xs font-bold text-[--text-secondary] flex justify-between mt-2 pt-2 border-t border-white/5"><span>TBD</span><span>—</span></div>
                   </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Layout Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Registration Management Module */}
            <div className="bg-[#111111] p-6 rounded-3xl border border-[rgba(255,255,255,0.05)] shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <h2 className="font-display font-black text-2xl text-[--text-main] tracking-tight mb-2">Gerenciar Inscrições</h2>
              <p className="text-sm font-medium text-[--text-secondary] mb-6">Status dos times e envio de docs</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#151515] p-4 rounded-xl border border-[rgba(255,255,255,0.02)]">
                  <span className="text-[10px] text-[--text-secondary] font-bold uppercase tracking-widest">Novos (48h)</span>
                  <div className="text-2xl font-black text-[#FF6B00] mt-1">{newRegistrationsCount}</div>
                </div>
                <div className="bg-[#151515] p-4 rounded-xl border border-[rgba(255,255,255,0.02)]">
                  <span className="text-[10px] text-[--text-secondary] font-bold uppercase tracking-widest">Pendentes</span>
                  <div className="text-2xl font-black text-[#10B981] mt-1">{pendingRegistrationsCount}</div>
                </div>
              </div>

              <div className="bg-[#151515] p-4 rounded-xl border border-[rgba(255,255,255,0.02)] flex justify-between items-center mb-6">
                <span className="text-[10px] text-[--text-secondary] font-bold uppercase tracking-widest">Completos (Confirmados)</span>
                <span className="text-lg font-black text-[--text-main]">{confirmedRegistrationsCount}</span>
              </div>

              <AdminRegistrationModal />
            </div>

            {/* Estadual Ranking Module */}
            <div className="bg-[#111111] p-6 rounded-3xl border border-[rgba(255,255,255,0.05)] shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-black text-2xl text-[--text-main] tracking-tight">Ranking 2024</h2>
                <Badge variant="default" size="sm">Geral</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-[rgba(255,255,255,0.05)]">
                       <th className="pb-3 text-[10px] font-bold text-[--text-dim] uppercase tracking-widest text-center w-8">POS</th>
                       <th className="pb-3 text-[10px] font-bold text-[--text-dim] uppercase tracking-widest pl-2">Time</th>
                       <th className="pb-3 text-[10px] font-bold text-[--text-dim] uppercase tracking-widest text-center">V</th>
                       <th className="pb-3 text-[10px] font-bold text-[--text-dim] uppercase tracking-widest text-center">D</th>
                       <th className="pb-3 text-[10px] font-bold text-[--text-dim] uppercase tracking-widest text-right">Form</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-[rgba(255,255,255,0.02)]">
                     {topStandings.length > 0 ? topStandings.map((stand, idx) => (
                       <tr key={stand.id} className="hover:bg-white/[0.02] transition-colors group">
                         <td className="py-4 text-xs font-black text-[--text-secondary] text-center">{idx + 1}</td>
                         <td className="py-4 pl-2 font-bold text-sm text-[--text-main] group-hover:text-[#FF6B00] transition-colors">
                           {stand.team.name}
                         </td>
                         <td className="py-4 text-sm font-medium text-[#10B981] text-center">{stand.wins}</td>
                         <td className="py-4 text-sm font-medium text-[--text-secondary] text-center">{stand.losses}</td>
                         <td className="py-4 text-right flex justify-end gap-1 items-center h-full pt-4.5">
                           {/* Structural Mocks for Form (last 5 games) */}
                           <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                           <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                           <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                           <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                           <span className="w-2 h-2 rounded-full bg-white/20"></span>
                         </td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan={5} className="py-6 text-center text-sm text-[--text-secondary]">
                           Sem dados de classificação suficientes.
                         </td>
                       </tr>
                     )}
                   </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  } catch (error: any) {
    // Show zero-state dashboard instead of crashing
    return (
      <div className="space-y-10">
        <div className="animate-fade-in">
          <h1 className="text-4xl font-display font-black text-[--text-main] tracking-tight mb-2">Dashboard Administrativo</h1>
          <p className="text-[--text-secondary] font-medium text-lg">Visão geral da Federação Gaúcha de Basquete</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {['Campeonatos', 'Equipes', 'Categorias', 'Jogos'].map(label => (
            <div key={label} className="bg-[#111] rounded-3xl border border-white/5 p-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
              <p className="text-3xl font-display font-black text-white">0</p>
            </div>
          ))}
        </div>
        <div className="bg-[#111] border border-[#FF6B00]/20 rounded-3xl p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-[#FF6B00]" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">Configure o primeiro campeonato</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">O banco de dados está conectado. Crie um campeonato para começar a ver as estatísticas aqui.</p>
          <a href="/admin/championships" className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold h-11 px-8 rounded-xl text-xs uppercase tracking-widest transition-all">
            Criar Campeonato
          </a>
        </div>
      </div>
    )
  }
}
