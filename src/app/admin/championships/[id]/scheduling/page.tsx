"use client"

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/Badge'
import { Section } from '@/components/Section'
import { ArrowLeft, Sparkles, Calendar, MapPin, Trophy, ShieldAlert, CheckCircle2, Loader2, Download, Mail, AlertTriangle } from 'lucide-react'
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
  const [showConflictsModal, setShowConflictsModal] = useState(false)

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
          games: result.games,
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
        <Loader2 className="w-10 h-10 text-[var(--fgb-yellow-500)] animate-spin" />
        <p className="text-fgb-ink-500 font-bold uppercase tracking-widest text-xs">Carregando dados do campeonato...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link href={`/admin/championships/${id}/manage`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)] mb-4 hover:text-[var(--black)] transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Voltar para Gestão
          </Link>
          <h1 className="fgb-display text-4xl text-[var(--black)] leading-none flex items-center gap-4">
            Agendamento IA
            <span className="bg-blue-50 border border-blue-200 text-blue-600 text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full shadow-sm">
              Beta Otimizador
            </span>
          </h1>
          <p className="text-[var(--gray)] font-medium mt-2">Campeonato: <span className="text-[var(--black)] font-bold">{championship.name}</span></p>
        </div>
        
        {!result && (
          <Button 
            disabled={loading} 
            onClick={handleSimulate}
            className="h-14 px-10 rounded-2xl bg-[var(--amarelo)] hover:bg-[var(--fgb-yellow-700)] text-[var(--black)] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95"
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
        <Card className="fgb-card p-12 text-center overflow-hidden bg-white relative">
           <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--amarelo)]/10 rounded-full blur-[120px] -mr-48 -mt-48" />
           <div className="relative z-10 max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-[30px] bg-[var(--gray-l)] border border-[var(--border)] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <Calendar className="w-10 h-10 text-[var(--gray)]" />
              </div>
              <h2 className="fgb-display text-3xl text-[var(--black)] leading-none mb-6">Pronto para organizar os confrontos?</h2>
              <p className="text-[var(--gray)] text-lg leading-relaxed mb-10">
                A IA analisará as sedes disponíveis, as datas bloqueadas pelas equipes e as categorias do campeonato para sugerir os melhores blocos de jogos, visando reduzir as distâncias de viagem.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                 {[
                   { icon: ShieldAlert, title: "Datas Bloqueadas", desc: "Respeita as restrições informadas." },
                   { icon: MapPin, title: "Logística Sede", desc: "Equipes próximas jogam juntas." },
                   { icon: Trophy, title: "Equilíbrio", desc: "Distribuição justa de mandos." }
                 ].map((item, i) => (
                   <div key={i} className="p-6 bg-white rounded-3xl border border-[var(--border)] shadow-sm">
                      <item.icon className="w-6 h-6 text-fgb-yellow-600 mb-4" />
                      <h4 className="font-bold text-[var(--black)] text-sm uppercase tracking-tighter mb-2">{item.title}</h4>
                      <p className="text-xs text-[var(--gray)] leading-relaxed">{item.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </Card>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Summary Banner */}
          <div className="bg-green-50 border border-green-200 p-6 rounded-3xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center border border-green-300">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg fgb-display text-[var(--black)] leading-none uppercase tracking-tight">Otimização Concluída</h3>
                <p className="text-[var(--gray)] text-sm font-medium">{typeof result.summary === 'string' ? result.summary : 'Calendário otimizado com sucesso.'}</p>
              </div>
            </div>
            <Button variant="ghost" onClick={() => setResult(null)} className="text-[var(--gray)] hover:text-[var(--black)] border border-[var(--border)] bg-white font-bold uppercase text-[10px] tracking-widest">
              Recalcular
            </Button>
          </div>

          {result.validation && typeof result.validation.capacityPercent === 'number' && (
            <Card className="fgb-card bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">
                    Capacidade do Calendário
                  </p>
                  <p className="text-[var(--gray)] text-sm font-medium mt-1">
                    {result.validation.totalSlotsNeeded} jogos · {result.validation.totalSlotsAvailable} slots disponíveis
                  </p>
                </div>
                <span
                  className={`fgb-display text-5xl leading-none ${
                    result.validation.capacityPercent > 100
                      ? 'text-red-600'
                      : result.validation.capacityPercent > 85
                        ? 'text-fgb-yellow-700'
                        : 'text-green-700'
                  }`}
                >
                  {result.validation.capacityPercent}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-[var(--gray-l)] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    result.validation.capacityPercent > 100
                      ? 'bg-red-500'
                      : result.validation.capacityPercent > 85
                        ? 'bg-fgb-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, result.validation.capacityPercent)}%` }}
                />
              </div>
              {result.validation.warnings && result.validation.warnings.length > 0 && (
                <div className="mt-5 pt-5 border-t border-[var(--border)] flex items-center justify-between">
                  <p className="text-[var(--gray)] text-sm font-medium">
                    {result.validation.warnings.length} {result.validation.warnings.length === 1 ? 'alerta detectado' : 'alertas detectados'}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setShowConflictsModal(true)}
                    className="border border-[var(--border)] bg-white text-[var(--black)] font-bold text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-[var(--gray-l)]"
                  >
                    Ver Detalhes
                  </Button>
                </div>
              )}
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Viability & Summary (Left - 4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              <Section title="Viabilidade" subtitle="Categorias confirmadas pela IA">
                <Card className="fgb-card bg-white p-6">
                  <div className="space-y-4">
                    {(result.categories || []).map((cat: any) => (
                      <div key={cat.id} className="flex justify-between items-center p-4 bg-[var(--gray-l)] rounded-2xl border border-[var(--border)] shadow-sm">
                        <span className="font-bold text-[var(--black)] text-sm uppercase">{cat.name}</span>
                        <Badge variant="success" className="bg-green-50 text-green-600 border-green-200 text-[9px] font-black uppercase tracking-widest px-3">
                          {cat.teams} EQUIPES
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>
            </div>

            {/* Blocks & Game Matrix (Right - 8 cols) */}
            <div className="lg:col-span-8">
              <Section title="Matriz de Confrontos" subtitle="Agrupamento por data e fase">
                <div className="space-y-6">
                  {(result.schedulePreview || []).map((day: any, di: number) => (
                    <Card key={day.date} className="fgb-card bg-white overflow-hidden shadow-sm">
                      <div className="p-8 bg-[var(--gray-l)] border-b border-[var(--border)]">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-2xl fgb-display text-fgb-yellow-600 leading-none uppercase tracking-tight">
                            {new Date(`${day.date}T12:00:00.000Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' })}
                          </h4>
                          <span className="bg-white border border-[var(--border)] text-[var(--black)] px-3 py-1 rounded-full text-[9px] font-bold shadow-sm">DIA {di + 1}</span>
                        </div>
                        <p className="text-[var(--gray)] text-sm font-medium leading-relaxed">
                          {day.dayOfWeek} · {day.gamesCount} jogos · {(day.categories || []).join(', ')}
                        </p>
                      </div>

                      <div className="p-8 hover:bg-[var(--gray-l)] transition-colors">
                        <div className="flex items-center justify-between gap-6 mb-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-fgb-yellow-50 border border-fgb-yellow-100">
                              <Calendar className="w-5 h-5 text-fgb-yellow-600" />
                            </div>
                            <div>
                              <h5 className="fgb-display text-[var(--black)] leading-none text-lg mb-1">Fase {day.phase}</h5>
                              <p className="text-[var(--gray)] text-xs font-bold uppercase tracking-widest">{(day.categories || []).join(' + ')}</p>
                            </div>
                          </div>
                          <span className="bg-[var(--amarelo)] text-[var(--black)] font-black px-4 py-2 rounded-xl text-[10px] tracking-widest shadow-sm">
                            {(day.timeSlots || []).length} JOGOS
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          {(day.timeSlots || []).slice(0, 6).map((slot: any, si: number) => (
                            <div key={si} className="p-4 bg-white rounded-2xl border border-[var(--border)] flex items-center justify-between gap-3 text-xs shadow-sm">
                              <span className="text-[10px] font-black text-[var(--gray)] uppercase tracking-widest min-w-[40px]">{slot.time}</span>
                              <span className="font-black text-[var(--black)] uppercase truncate max-w-[100px]">{slot.homeTeamName}</span>
                              <span className="text-[var(--verde)] font-black italic">VS</span>
                              <span className="font-black text-[var(--black)] uppercase truncate max-w-[100px]">{slot.awayTeamName}</span>
                            </div>
                          ))}
                          {(day.timeSlots || []).length > 6 && (
                            <div className="col-span-1 md:col-span-2 text-center pt-2">
                              <span className="text-[10px] font-black text-[var(--gray)] uppercase tracking-widest">+ {day.timeSlots.length - 6} Outros Jogos Mapeados</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Section>

              {/* Action Bar */}
              <Card className="mt-12 bg-white border-[var(--border)] rounded-[40px] p-8 shadow-sm">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                       <h3 className="text-2xl fgb-display text-[var(--black)] leading-none mb-2">Finalizar Organização</h3>
                       <p className="text-[var(--gray)] text-sm font-medium">Ao confirmar, as sedes e confrontos serão oficializados.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                       <Button 
                         onClick={handleApply} 
                         disabled={applying}
                         className="flex-1 md:flex-none h-14 px-10 rounded-2xl bg-[var(--verde)] hover:opacity-90 text-[var(--black)] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105"
                       >
                         {applying ? <Loader2 className="animate-spin" /> : "Aprovar e Publicar"}
                       </Button>
                       <div className="flex gap-2">
                          <Button variant="ghost" className="w-12 h-14 rounded-2xl bg-[var(--gray-l)] border border-[var(--border)] p-0 flex items-center justify-center hover:bg-[var(--amarelo)]">
                             <Download className="w-5 h-5 text-[var(--black)]" />
                          </Button>
                          <Button variant="ghost" className="w-12 h-14 rounded-2xl bg-[var(--gray-l)] border border-[var(--border)] p-0 flex items-center justify-center hover:bg-[var(--amarelo)]">
                             <Mail className="w-5 h-5 text-[var(--black)]" />
                          </Button>
                       </div>
                    </div>
                 </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {showConflictsModal && result?.validation?.warnings && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowConflictsModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl fgb-display text-[var(--black)] leading-none">
                Alertas do Calendário
              </h3>
              <button
                type="button"
                onClick={() => setShowConflictsModal(false)}
                aria-label="Fechar"
                className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--gray)] hover:text-[var(--black)] hover:bg-[var(--gray-l)] transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {result.validation.warnings.map((w: any, i: number) => {
                const isWarning = w.severity === 'WARNING'
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl flex items-start gap-3 border ${
                      isWarning ? 'bg-fgb-yellow-50 border-fgb-yellow-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <AlertTriangle
                      size={18}
                      className={`flex-shrink-0 mt-0.5 ${isWarning ? 'text-fgb-yellow-700' : 'text-blue-700'}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isWarning ? 'text-fgb-yellow-700' : 'text-blue-700'}`}>
                        {w.type}
                      </p>
                      <p className="text-sm mt-1 text-[var(--black)] leading-relaxed">
                        {w.message}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
