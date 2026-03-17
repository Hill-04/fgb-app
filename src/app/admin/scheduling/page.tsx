"use client"

import { AIChat } from '@/components/ai-chat'
import { Sparkles, BrainCircuit, Calendar as CalendarIcon, MapPin, Users } from 'lucide-react'

export default function SchedulingPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <BrainCircuit className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500/80">
              Inteligência Artificial FGB
            </span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight text-slate-100 italic uppercase">
            Calendário <span className="text-orange-500">Inteligente</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-2xl mt-2">
            Organize jogos, gerencie sedes e resolva conflitos de logística através de nossa IA especializada. 
            O assistente tem acesso completo a equipes, ginásios e feriados em tempo real.
          </p>
        </div>

        {/* Info stats */}
        <div className="flex flex-wrap gap-4 text-[10px] uppercase font-bold tracking-wider text-slate-500">
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
             <Users className="w-3 h-3 text-blue-400" />
             Equipes Sincronizadas
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
             <MapPin className="w-3 h-3 text-red-400" />
             Ginásios Mapeados
           </div>
           <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
             <CalendarIcon className="w-3 h-3 text-green-400" />
             Feriados Atuais
           </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500/20 via-purple-500/10 to-transparent rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
        <div className="relative">
          <AIChat />
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
             <h4 className="text-xs font-bold text-slate-100 uppercase mb-2 flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-orange-500" />
               Como funciona?
             </h4>
             <p className="text-[11px] text-slate-500 leading-relaxed">
               A IA processa as "Blocked Dates" de cada equipe e cruza com a disponibilidade de ginásios sedes para sugerir a melhor logística.
             </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
             <h4 className="text-xs font-bold text-slate-100 uppercase mb-2 flex items-center gap-2">
               <BrainCircuit className="w-3 h-3 text-purple-500" />
               Ações Diretas
             </h4>
             <p className="text-[11px] text-slate-500 leading-relaxed">
               Você pode pedir para a IA "Gerar confrontos" ou "Criar blocos". Ela processará o pedido e mostrará um card de confirmação.
             </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/50">
             <h4 className="text-xs font-bold text-slate-100 uppercase mb-2 flex items-center gap-2">
               <CalendarIcon className="w-3 h-3 text-blue-500" />
               Datas Alternativas
             </h4>
             <p className="text-[11px] text-slate-500 leading-relaxed">
               Sempre solicite um Plano B. A IA sugerirá datas reservas caso surjam imprevistos em ginásios ou clima.
             </p>
          </div>
      </div>
    </div>
  )
}
