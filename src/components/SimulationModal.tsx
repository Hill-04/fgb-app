"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Play, 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  Trophy, 
  Users,
  Settings2
} from "lucide-react"
import { cn } from "@/lib/utils"

type Step = {
  step: number
  label: string
  status: 'pending' | 'loading' | 'done' | 'error'
  detail?: string
}

const INITIAL_STEPS: Step[] = [
  { step: 1, label: 'Criar Campeonato', status: 'pending' },
  { step: 2, label: 'Inscrever Equipes', status: 'pending' },
  { step: 3, label: 'Validar Categorias', status: 'pending' },
  { step: 4, label: 'Gerar Confrontos', status: 'pending' },
  { step: 5, label: 'Definir Datas e Locais', status: 'pending' },
  { step: 6, label: 'Simular Resultados', status: 'pending' },
  { step: 7, label: 'Resumo Final', status: 'pending' },
]

export function SimulationModal({ isOpen, onClose, onComplete }: { isOpen: boolean, onClose: () => void, onComplete: () => void }) {
  const [config, setConfig] = useState({
    name: 'Estadual 2026 Simulado',
    sex: 'masculino',
    categories: ['Sub 13', 'Sub 15', 'Sub 17']
  })
  const [isRunning, setIsRunning] = useState(false)
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const handleRun = async () => {
    setIsRunning(true)
    setError(null)
    setSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'pending' })))
    
    try {
      const response = await fetch('/api/admin/simulation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })

      if (!response.body) throw new Error("Falha ao iniciar stream")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.step === -1) {
              setError(data.detail)
              setIsRunning(false)
              return
            }

            setSteps(prev => prev.map(s => {
              if (s.step === data.step) {
                return { ...s, status: data.status, detail: data.detail }
              }
              if (s.step < data.step) {
                return { ...s, status: 'done' }
              }
              return s
            }))
            setCurrentStep(data.step)

            if (data.step === 7 && data.status === 'done') {
              setIsRunning(false)
              setTimeout(() => {
                onComplete()
                onClose()
              }, 2000)
            }
          } catch (e) {
            console.error("Error parsing chunk", e)
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
      setIsRunning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-xl bg-[#0A0A0A] border-purple-500/20 text-white rounded-[32px] shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5 relative bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="absolute top-0 right-0 p-6">
             <Button variant="ghost" size="icon" onClick={onClose} disabled={isRunning} className="rounded-full hover:bg-white/5">
               <X className="w-5 h-5 text-slate-500" />
             </Button>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
               <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display font-black uppercase tracking-tight">Setup de Simulação</CardTitle>
              <CardDescription className="text-xs font-bold text-purple-400/70 uppercase tracking-widest">Motor de Geração AI Engine</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {!isRunning && currentStep === 0 ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Nome da Simulação</Label>
                <Input 
                  value={config.name} 
                  onChange={e => setConfig({...config, name: e.target.value})}
                  className="bg-white/5 border-white/10 h-13 rounded-2xl focus:border-purple-500/50"
                  placeholder="Ex: Torneio Demo 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Sexo</Label>
                  <select 
                    value={config.sex}
                    onChange={e => setConfig({...config, sex: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 h-13 rounded-2xl px-4 text-sm font-bold focus:border-purple-500/50 outline-none"
                  >
                    <option value="masculino" className="bg-[#0A0A0A]">Masculino</option>
                    <option value="feminino" className="bg-[#0A0A0A]">Feminino</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Ambiente</Label>
                  <div className="h-13 flex items-center px-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl text-[10px] font-black uppercase text-purple-400 gap-2">
                    <Trophy className="w-3.5 h-3.5" />
                    Sandbox Mode
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Categorias Base</Label>
                <div className="flex flex-wrap gap-2">
                  {['Sub 12', 'Sub 13', 'Sub 15', 'Sub 17', 'Sub 19'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        const exists = config.categories.includes(cat)
                        setConfig({
                          ...config,
                          categories: exists 
                            ? config.categories.filter(c => c !== cat)
                            : [...config.categories, cat]
                        })
                      }}
                      className={cn(
                        "px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all",
                        config.categories.includes(cat)
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                          : "bg-white/5 border-white/10 text-slate-500"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleRun}
                className="w-full bg-purple-600 hover:bg-purple-700 h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Iniciar Simulação
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500",
                      s.status === 'done' ? "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]" :
                      s.status === 'loading' ? "bg-purple-500/10 border-purple-500/50 text-purple-400" :
                      s.status === 'error' ? "bg-red-500/10 border-red-500/50 text-red-400" :
                      "bg-white/5 border-white/10 text-slate-600"
                    )}>
                      {s.status === 'done' ? <CheckCircle2 className="w-4 h-4" /> :
                       s.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                       s.status === 'error' ? <AlertCircle className="w-4 h-4" /> :
                       <span className="text-[10px] font-black">{s.step}</span>}
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center">
                         <span className={cn(
                           "text-xs font-black uppercase tracking-widest",
                           s.status === 'loading' ? "text-white" : "text-slate-500"
                         )}>{s.label}</span>
                         {s.status === 'loading' && <span className="text-[#FF6B00] text-[8px] font-black animate-pulse uppercase">Processando...</span>}
                       </div>
                       {s.detail && <p className="text-[10px] text-slate-600 font-medium mt-0.5">{s.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in shake-in">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-red-500 uppercase tracking-widest">Erro na Simulação</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{error}</p>
                    <Button onClick={() => { setCurrentStep(0); setError(null); }} variant="link" className="p-0 h-auto text-[10px] text-red-400 font-bold uppercase mt-2">Tentar Novamente</Button>
                  </div>
                </div>
              )}

              {currentStep === 7 && !isRunning && (
                <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-3xl text-center space-y-2 animate-in zoom-in-95">
                  <h3 className="text-base font-black text-white uppercase tracking-tight">Ambiente Pronto!</h3>
                  <p className="text-xs text-slate-500">O campeonato simulado já pode ser explorado nos menus.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
