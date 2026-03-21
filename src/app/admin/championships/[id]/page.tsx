import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/Badge'
import { RegistrationActions } from './RegistrationActions'
import { ManualRegistrationModal } from './ManualRegistrationModal'
import { ChampionshipManagementActions } from './ChampionshipManagementActions'
import { AIOptimizerModal } from './AIOptimizerModal'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, MapPin, Users, Info, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatChampionshipStatus } from '@/lib/utils'

import { ChampionshipAIPipeline } from './ChampionshipAIPipeline'

export default async function ChampionshipDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const championship = await prisma.championship.findUnique({
    where: { id },
    include: {
      categories: true,
      registrations: {
        include: {
          team: true,
          categories: { include: { category: true } },
          blockedDates: true
        },
        orderBy: { registeredAt: 'desc' }
      }
    }
  })

  if (!championship) {
    notFound()
  }

  // Map status to pipeline step
  const statusToStep: Record<string, number> = {
    DRAFT: 1,
    REGISTRATION_OPEN: 2,
    SCHEDULED: 4,
    IN_PROGRESS: 6,
    FINISHED: 6
  }
  const currentStep = statusToStep[championship.status] || 1

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="blue" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 font-black uppercase tracking-widest text-[9px]">
              {formatChampionshipStatus(championship.status)}
            </Badge>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Painel de Controle IA</span>
          </div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic leading-none">
            {championship.name}
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <AIOptimizerModal 
            championshipId={championship.id} 
            championshipName={championship.name} 
          />
          <ChampionshipManagementActions 
            championshipId={championship.id} 
            championshipName={championship.name} 
          />
          <ManualRegistrationModal 
            championshipId={championship.id}
            categories={championship.categories}
            startDate={championship.startDate || undefined}
            endDate={championship.endDate || undefined}
          />
        </div>
      </div>

      {/* AI Pipeline */}
      <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#FF6B00]" />
              <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">Fluxo de Otimização Inteligente</h3>
           </div>
           <Badge className="bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20 font-black uppercase tracking-widest text-[9px]">
              Fase {currentStep} de 6
           </Badge>
        </div>
        <ChampionshipAIPipeline currentStep={currentStep} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Registrations Table */}
          <Card className="bg-[#0A0A0A] border-white/5 text-white overflow-hidden rounded-3xl">
            <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display font-black uppercase tracking-tight">Equipes Inscritas</CardTitle>
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">Gestão de inscrições e categorias</p>
              </div>
              <Badge className="bg-white/5 text-white border-white/10">{championship.registrations.length} Equipes</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {championship.registrations.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                  <p className="text-slate-500 text-sm font-medium">Nenhuma equipe inscrita ainda.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 pl-8">Equipe / Cidade</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6">Categorias</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6">Sede</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6">Bloqueios</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-slate-500 py-6 text-right pr-8">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {championship.registrations.map((reg) => (
                        <TableRow key={reg.id} className="border-white/5 hover:bg-white/[0.02] group transition-all">
                          <TableCell className="py-6 pl-8">
                            <div className="font-bold text-sm tracking-tight text-white group-hover:text-[#FF6B00] transition-colors">{reg.team.name}</div>
                            <div className="text-[10px] font-medium text-slate-500 uppercase">{reg.team.city || 'Cidade N/A'}</div>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex flex-wrap gap-1">
                              {reg.categories.map((c) => (
                                <span key={c.id} className="px-2 py-0.5 bg-[#FF6B00]/10 text-[#FF6B00] text-[9px] font-black uppercase rounded-md border border-[#FF6B00]/20">
                                  {c.category.name}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            {reg.canHost ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-green-500 uppercase flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5" /> Sim
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={reg.gymName || ''}>
                                  {reg.gymName}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[9px] font-black text-slate-600 uppercase">Não</span>
                            )}
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-xs font-bold text-white">{reg.blockedDates.length}</span>
                              <span className="text-[9px] font-black text-slate-500 uppercase">Datas</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <Badge 
                              variant={
                                reg.status === 'CONFIRMED' ? 'success' : 
                                reg.status === 'REJECTED' ? 'error' : 'warning'
                              }
                              className="text-[9px] font-black uppercase"
                            >
                              {reg.status === 'CONFIRMED' ? 'Confirmada' : 
                               reg.status === 'REJECTED' ? 'Rejeitada' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6 text-right pr-8">
                            <RegistrationActions 
                              championshipId={championship.id}
                              registration={reg}
                              categories={championship.categories}
                              startDate={championship.startDate || undefined}
                              endDate={championship.endDate || undefined}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <Card className="bg-[#0A0A0A] border-white/5 text-white overflow-hidden rounded-3xl">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="text-sm font-display font-black uppercase tracking-tight">Status das Categorias</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {championship.categories.map((c) => {
                const confirmedCount = championship.registrations.filter(r => 
                  r.status === 'CONFIRMED' && r.categories.some(rc => rc.categoryId === c.id)
                ).length
                
                return (
                  <div key={c.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-tight text-white">{c.name}</span>
                      <Badge variant={c.isViable ? "success" : "warning"} className="text-[8px] py-0 h-4">
                        {c.isViable ? "Viável" : "Inviável"}
                      </Badge>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-1000 ${c.isViable ? 'bg-green-500' : 'bg-[#FF6B00]'}`}
                        style={{ width: `${Math.min(100, (confirmedCount / championship.minTeamsPerCat) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase">
                      <span>{confirmedCount} Confirmadas</span>
                      <span>Mínimo: {championship.minTeamsPerCat}</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="bg-[#0A0A0A] border-white/5 text-white overflow-hidden rounded-3xl">
            <CardHeader className="p-6 border-b border-white/5">
              <CardTitle className="text-sm font-display font-black uppercase tracking-tight">Detalhes Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-[11px]">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500 font-bold uppercase tracking-tight">Formato</span>
                <span className="text-white font-black uppercase">{championship.format.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-500 font-bold uppercase tracking-tight">Período</span>
                <span className="text-white font-black uppercase">
                  {championship.startDate ? format(championship.startDate, 'MMM/yy', { locale: ptBR }) : 'N/A'} - {championship.endDate ? format(championship.endDate, 'MMM/yy', { locale: ptBR }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 font-bold uppercase tracking-tight">Mín. Times/Cat</span>
                <span className="text-white font-black">{championship.minTeamsPerCat}</span>
              </div>
              
              <div className="mt-6 p-4 bg-[#FF6B00]/5 border border-[#FF6B00]/10 rounded-2xl flex gap-3">
                <Info className="w-4 h-4 text-[#FF6B00] shrink-0" />
                <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed">
                  A viabilidade é calculada automaticamente baseada no número mínimo de equipes confirmadas em cada categoria.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
