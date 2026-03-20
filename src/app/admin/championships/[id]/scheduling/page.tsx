"use client"

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import { Section } from '@/components/Section'
import { ArrowLeft, Sparkles, Calendar, MapPin, Trophy, ShieldAlert, CheckCircle2, Loader2, Download, Mail } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
// jspdf e xlsx movidos para carregamento dinâmico ou removidos se não utilizados para compatibilidade com Turbopack

export default function ChampionshipSchedulingPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [applying, setApplying] = useState(false)
  const [championship, setChampionship] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/championships/${id}`)
      .then(res => res.json())
      .then(data => setChampionship(data))
      .catch(err => console.error('Erro ao carregar campeonato:', err))
  }, [id])

  const handleSimulate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scheduling/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championshipId: id })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao comunicar com a IA')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!result) return
    if (!confirm('Deseja realmente aplicar este calendário? Os jogos serão criados e o status do campeonato será alterado para CONFIRMADO.')) return
    
    setApplying(true)
    try {
      const res = await fetch('/api/scheduling/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          championshipId: id,
          blocks: result.blocks,
          viableCategories: result.viableCategories
        })
      })
      
      if (res.ok) {
        alert('Calendário aplicado com sucesso!')
        router.push(`/admin/championships/${id}/manage`)
      } else {
        alert('Erro ao aplicar calendário.')
      }
    } catch (err) {
      alert('Erro de conexão.')
    } finally {
      setApplying(false)
    }
  }

  if (!championship) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#FF6B00] animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando dados do campeonato...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link href={`/admin/championships/${id}/manage`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Voltar para Gestão
          </Link>
          <h1 className="text-4xl font-display font-black text-white tracking-tight flex items-center gap-4">
            Agendamento IA
            <Badge variant="blue" className="bg-blue-500/10 border-blue-500/20 text-[10px] uppercase font-black tracking-widest px-4 h-8">
              Beta Otimizador
            </Badge>
          </h1>
          <p className="text-slate-400 font-medium mt-2">Campeonato: <span className="text-white font-bold">{championship.name}</span></p>
        </div>
        
        {!result && (
          <Button 
            disabled={loading} 
            onClick={handleSimulate}
            className="h-14 px-10 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black uppercase tracking-widest shadow-xl shadow-[#8B5CF6]/20 transition-all hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Processando Otimização...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-3" />
                Gerar Tabela com IA
              </>
            )}
          </Button>
        )}
      </div>

      {!result ? (
        <Card className="bg-[#111] border-white/5 rounded-[40px] p-12 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF6B00]/5 rounded-full blur-[120px] -mr-48 -mt-48" />
           <div className="relative z-10 max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-[30px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
                <Calendar className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-3xl font-display font-black text-white mb-6">Pronto para organizar os confrontos?</h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-10">
                A IA analisará as sedes disponíveis, as datas bloqueadas pelas equipes e as categorias do campeonato para sugerir os melhores blocos de jogos, visando reduzir as distâncias de viagem.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                 {[
                   { icon: ShieldAlert, title: "Datas Bloqueadas", desc: "Respeita as restrições informadas." },
                   { icon: MapPin, title: "Logística Sede", desc: "Equipes próximas jogam juntas." },
                   { icon: Trophy, title: "Equilíbrio", desc: "Distribuição justa de mandos." }
                 ].map((item, i) => (
                   <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <item.icon className="w-6 h-6 text-[#FF6B00] mb-4" />
                      <h4 className="font-bold text-white text-sm uppercase tracking-tighter mb-2">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </Card>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Summary Banner */}
          <div className="bg-[#10B981]/10 border border-[#10B981]/20 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <h3 className="text-lg font-display font-black text-white uppercase tracking-tight">Otimização Concluída</h3>
                <p className="text-slate-400 text-sm font-medium">{result.summary?.totalTravelSaved || 'Redução drástica de custos logísticos identificada.'}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-400 hover:text-white font-bold uppercase text-[10px] tracking-widest">
              Recalcular
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Viability & Summary (Left - 4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              <Section title="Viabilidade" subtitle="Categorias confirmadas pela IA">
                <Card className="bg-[#111] border-white/5 rounded-3xl p-6">
                  <div className="space-y-4">
                    {result.viableCategories.map((cat: any) => (
                      <div key={cat.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="font-bold text-white text-sm uppercase">{cat.title}</span>
                        <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black uppercase tracking-widest px-3">
                          {cat.teamsCount} EQUIPES
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>
            </div>

            {/* Blocks & Game Matrix (Right - 8 cols) */}
            <div className="lg:col-span-8">
              <Section title="Matriz de Confrontos e Sedes" subtitle="Agrupamento inteligente por sede e data">
                <div className="space-y-6">
                  {result.blocks.map((block: any, bi: number) => (
                    <Card key={bi} className="bg-[#111] border-white/5 rounded-3xl overflow-hidden">
                      <div className="p-8 bg-white/5 border-b border-white/5">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-2xl font-display font-black text-[#FF6B00] uppercase tracking-tight">{block.title}</h4>
                          <Badge variant="default" className="bg-white/10 border-white/10 text-[9px] font-bold">BLOCO {bi + 1}</Badge>
                        </div>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">{block.reason}</p>
                      </div>
                      
                      <div className="p-0">
                        {block.phases.map((phase: any, pi: number) => (
                          <div key={pi} className="p-8 border-b last:border-0 border-white/5 hover:bg-white/[0.01] transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-[#FF6B00]/5 border border-[#FF6B00]/10">
                                  <MapPin className="w-5 h-5 text-[#FF6B00]" />
                                </div>
                                <div>
                                  <h5 className="font-display font-black text-white uppercase tracking-tight text-lg">{phase.name}</h5>
                                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{phase.location} • {phase.city}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className="bg-white/5 text-slate-400 font-bold px-4 py-2 border-white/10">
                                  {new Date(phase.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                </Badge>
                                <span className="bg-[#FF6B00] text-white font-black px-4 py-2 rounded-xl text-[10px] tracking-widest">
                                  {phase.matches.length} JOGOS
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                               {phase.matches.slice(0, 4).map((m: any, mi: number) => (
                                 <div key={mi} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center gap-4 text-xs">
                                    <span className="font-black text-white uppercase truncate max-w-[80px]">{m.homeTeamId.slice(0, 5)}...</span>
                                    <span className="text-[#FF6B00] font-black italic">VS</span>
                                    <span className="font-black text-white uppercase truncate max-w-[80px]">{m.awayTeamId.slice(0, 5)}...</span>
                                 </div>
                               ))}
                               {phase.matches.length > 4 && (
                                 <div className="col-span-1 md:col-span-2 text-center pt-2">
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">+ {phase.matches.length - 4} Outros Jogos Mapeados</span>
                                 </div>
                               )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </Section>

              {/* Action Bar */}
              <Card className="mt-12 bg-gradient-to-r from-[#111] to-[#0a0a0a] border-white/5 rounded-[40px] p-8">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                       <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight mb-2">Finalizar Organização</h3>
                       <p className="text-slate-500 text-sm font-medium">Ao confirmar, as sedes e confrontos serão oficializados.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                       <Button 
                         onClick={handleApply} 
                         disabled={applying}
                         className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-black uppercase tracking-widest shadow-xl shadow-[#10B981]/10 transition-all hover:scale-105"
                       >
                         {applying ? <Loader2 className="animate-spin" /> : "Aprovar e Publicar"}
                       </Button>
                       <div className="flex gap-2">
                          <Button variant="ghost" className="w-12 h-14 rounded-2xl bg-white/5 border border-white/10 p-0 flex items-center justify-center">
                             <Download className="w-5 h-5 text-slate-400" />
                          </Button>
                          <Button variant="ghost" className="w-12 h-14 rounded-2xl bg-white/5 border border-white/10 p-0 flex items-center justify-center">
                             <Mail className="w-5 h-5 text-slate-400" />
                          </Button>
                       </div>
                    </div>
                 </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
