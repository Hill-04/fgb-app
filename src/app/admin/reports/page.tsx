import { prisma } from '@/lib/db'
import { Section } from '@/components/Section'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/Badge'
import { FileText, Download, TrendingUp, Users, Calendar, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  const registrationsCount = await prisma.registration.count()
  const teamsCount = await prisma.team.count()
  const gamesCount = await prisma.game.count()
  
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="animate-fade-in flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.05] pb-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#FF6B00]" />
             </div>
             <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Relatórios & Dashboards</span>
          </div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight">Central de Relatórios</h1>
          <p className="text-slate-400 mt-2 font-medium">Análise de dados, exportações e estatísticas da temporada.</p>
        </div>
        
        <div className="flex gap-3">
           <Button variant="outline" className="bg-white/5 border-white/10 text-white font-bold h-11 px-6 rounded-xl hover:bg-white/10 transition-all">
             <Filter className="w-4 h-4 mr-2" />
             Filtrar Dados
           </Button>
           <Button className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold h-11 px-6 rounded-xl transition-all shadow-lg shadow-[#FF6B00]/20">
             <Download className="w-4 h-4 mr-2" />
             Exportar Tudo
           </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up">
        <StatCard
          label="Inscrições Totais"
          value={registrationsCount}
          sublabel="Temporada 2026"
          accent="orange"
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          label="Equipes Ativas"
          value={teamsCount}
          sublabel="Em competição"
          accent="blue"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Jogos Realizados"
          value={gamesCount}
          sublabel="Súmulas enviadas"
          accent="green"
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          label="Crescimento"
          value="+12%"
          sublabel="vs. ano anterior"
          accent="purple"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <Section title="Relatórios Disponíveis" subtitle="Escolha um módulo para gerar o documento">
           <div className="grid gap-4 mt-6">
             {[
               { title: 'Relatório Geral de Inscrições', desc: 'Listagem completa de equipes, categorias e status de pagamento.', type: 'PDF' },
               { title: 'Tabela de Confrontos (Geral)', desc: 'Cronograma completo de jogos organizado por data e ginásio.', type: 'XLSX' },
               { title: 'Performance Técnica por Equipe', desc: 'Estatísticas de vitórias, derrotas e médias de pontuação.', type: 'PDF' },
               { title: 'Relatório Financeiro', desc: 'Resumo de taxas, isenções e pendências (Apenas leitura).', type: 'PDF' },
             ].map((report, idx) => (
               <div key={idx} className="group bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:border-[#FF6B00]/30 transition-all">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#FF6B00] group-hover:scale-110 transition-transform">
                       <FileText className="w-5 h-5" />
                    </div>
                    <div>
                       <h4 className="text-sm font-bold text-white tracking-tight">{report.title}</h4>
                       <p className="text-[10px] text-slate-500 font-medium">{report.desc}</p>
                    </div>
                 </div>
                 <Badge variant="default" className="bg-white/5 border-white/10 text-[9px] font-black">{report.type}</Badge>
               </div>
             ))}
           </div>
        </Section>

        <Section title="Exportações Recentes" subtitle="Últimos documentos gerados pelo sistema">
           <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden mt-6 shadow-2xl">
              <div className="p-8 text-center">
                 <div className="w-16 h-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center opacity-20">
                    <Download className="w-8 h-8" />
                 </div>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nenhuma exportação recente</p>
                 <p className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto">Os arquivos gerados nos últimos 7 dias aparecerão aqui para download rápido.</p>
              </div>
           </div>
        </Section>
      </div>
    </div>
  )
}
