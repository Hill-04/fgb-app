'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Cpu, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  MapPin, 
  Calendar,
  Zap,
  DollarSign,
  TrendingDown
} from 'lucide-react'
import { Badge } from '@/components/Badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type AIOptimizerModalProps = {
  championshipId: string
  championshipName: string
}

export function AIOptimizerModal({ championshipId, championshipName }: AIOptimizerModalProps) {
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSimulate = async () => {
    setLoading(true)
    setResults(null)
    try {
      const res = await fetch('/api/scheduling/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championshipId })
      })
      if (res.ok) {
        const data = await res.json()
        setResults(data)
        toast.success("Otimização concluída com sucesso!")
      } else {
        toast.error("Erro ao processar otimização")
      }
    } catch (err) {
      toast.error("Erro na comunicação com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!results) return
    setApplying(true)
    try {
      const res = await fetch('/api/scheduling/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          championshipId,
          blocks: results.blocks,
          viableCategories: results.viableCategories
        })
      })
      if (res.ok) {
        toast.success("Calendário aplicado e salvo!")
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Erro ao aplicar calendário")
      }
    } catch (err) {
      toast.error("Erro ao salvar")
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black uppercase tracking-widest gap-2 h-11 px-6 rounded-xl shadow-lg shadow-purple-900/20">
            <Cpu className="w-4 h-4" />
            Otimização IA
          </Button>
        }
      />
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto rounded-[40px] p-0 border-none shadow-2xl">
        <div className="p-10 space-y-8">
           <DialogHeader>
              <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6">
                 <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <DialogTitle className="text-3xl font-display font-black uppercase tracking-tight">Motor de Otimização FGB</DialogTitle>
              <DialogDescription className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-2 max-w-xl">
                 Nossa IA analisa mais de 100 variáveis — incluindo datas bloqueadas, capacidade de sede e custos logísticos — para criar o campeonato perfeito.
              </DialogDescription>
           </DialogHeader>

           {!results && !loading && (
             <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[32px] p-20 text-center space-y-6">
                <div className="flex flex-col items-center">
                   <h3 className="text-xl font-display font-black text-white uppercase mb-2">Pronto para Otimizar?</h3>
                   <p className="text-slate-500 text-sm max-w-xs mx-auto">Ao clicar abaixo, a IA do Google Gemini irá processar todas as inscrições confirmadas.</p>
                </div>
                <Button 
                  onClick={handleSimulate}
                  className="bg-[#FF6B00] hover:bg-[#E66000] text-white font-black uppercase tracking-widest h-14 px-12 rounded-2xl transition-all"
                >
                  Iniciar Inteligência
                </Button>
             </div>
           )}

           {loading && (
             <div className="p-32 text-center space-y-8 animate-pulse">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto" />
                <div>
                   <h3 className="text-xl font-display font-black text-white uppercase">Calculando Rotas e Horários...</h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Isso pode levar alguns segundos</p>
                </div>
             </div>
           )}

           {results && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Viability Banner */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[32px]">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                         </div>
                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Viabilidade Confirmada</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {results.viableCategories?.map((c: any) => (
                           <Badge key={c.id} className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase text-[9px] font-black">{c.title}</Badge>
                         ))}
                      </div>
                   </div>

                   <div className="bg-purple-500/5 border border-purple-500/10 p-8 rounded-[32px]">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <TrendingDown className="w-4 h-4 text-purple-400" />
                         </div>
                         <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Economia de Custos</span>
                      </div>
                      <div className="space-y-2">
                        {results.summary?.costSavingsTips?.map((tip: string, i: number) => (
                          <div key={i} className="flex gap-2 text-[10px] font-bold text-slate-300">
                             <span className="text-purple-500">•</span> {tip}
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                {/* Blocks Visualization */}
                <div className="space-y-6">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Plano de Jogos Gerado</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.blocks?.map((block: any) => (
                        <div key={block.id} className="bg-white/[0.03] border border-white/5 p-6 rounded-[28px] hover:bg-white/[0.05] transition-all">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <h5 className="font-display font-black text-white text-sm uppercase tracking-tight">{block.title}</h5>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-tight">{block.reason}</p>
                              </div>
                              <Badge className="bg-white/5 text-white border-white/10 text-[8px] font-black">{block.categories?.length} Cat</Badge>
                           </div>

                           <div className="space-y-4">
                              {block.phases?.map((phase: any, i: number) => (
                                <div key={i} className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                   <div className="flex items-center justify-between mb-3">
                                      <span className="text-[9px] font-black text-[#FF6B00] uppercase tracking-widest">{phase.name}</span>
                                      <span className="text-[8px] font-bold text-slate-500">{new Date(phase.date).toLocaleDateString('pt-BR')}</span>
                                   </div>
                                   <div className="flex items-center gap-2 text-[9px] font-bold text-slate-300">
                                      <MapPin className="w-3 h-3 text-slate-500" />
                                      {phase.location} • {phase.city}
                                   </div>
                                   <div className="mt-3 text-[10px] font-black text-white uppercase flex items-center justify-between">
                                      <span>{phase.matches?.length || 0} Jogos</span>
                                      <ChevronRight className="w-3 h-3 text-slate-700" />
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-4">
                   <Button 
                     variant="ghost" 
                     onClick={handleSimulate}
                     className="flex-1 h-14 font-black uppercase tracking-widest text-slate-500 hover:text-white rounded-2xl"
                   >
                     Recalcular Tudo
                   </Button>
                   <Button 
                     onClick={handleApply}
                     disabled={applying}
                     className="flex-[2] bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-purple-900/30 gap-3"
                   >
                     {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                     {applying ? 'Salvando no Banco...' : 'Aplicar Plano Logístico'}
                   </Button>
                </div>
             </div>
           )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
