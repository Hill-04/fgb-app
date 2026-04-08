"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function AdminRegistrationModal() {
  const [step, setStep] = useState(1)
  const [open, setOpen] = useState(false)

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4))
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1))

  const handleClose = () => {
    setOpen(false)
    setTimeout(() => setStep(1), 300) // Reset after close animation
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full bg-[var(--amarelo)] hover:bg-[var(--orange-dark)] text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm group flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Nova Inscrição (Manual)
      </DialogTrigger>

      {/* Glassmorphism Apple Overlay per user request for this specific modal */}
      <DialogContent className="sm:max-w-[600px] bg-[rgba(20,20,20,0.85)] backdrop-blur-2xl border border-[rgba(255,255,255,0.1)] text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-[rgba(255,255,255,0.05)]">
          <DialogTitle className="text-xl font-display font-black tracking-tight text-center">
            Nova Inscrição — Passo {step} de 4
          </DialogTitle>
          <div className="flex justify-center mt-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= i ? 'bg-[var(--amarelo)]' : 'bg-white/10'}`} 
              />
            ))}
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-lg font-bold">1. Identificação</h3>
              <p className="text-sm text-[--text-secondary] mb-4">Selecione o campeonato e a equipe correspondente.</p>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[--text-secondary]">Campeonato Ativo</label>
                  <select className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--amarelo)] transition-colors">
                    <option>Estadual Base 2026 - Masculino</option>
                    <option>Estadual Base 2026 - Feminino</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[--text-secondary]">Equipe</label>
                  <select className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--amarelo)] transition-colors">
                    <option>Selecione uma equipe vinculada</option>
                    <option>Sogipa</option>
                    <option>Flyboys</option>
                    <option>União Corinthians</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-lg font-bold">2. Categorias</h3>
              <p className="text-sm text-[--text-secondary] mb-4">Quais categorias a equipe disputará neste campeonato?</p>
              
              <div className="grid grid-cols-2 gap-3">
                {['Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 17'].map((cat) => (
                  <label key={cat} className="flex items-center gap-3 bg-[#111] border border-[rgba(255,255,255,0.05)] p-3 rounded-lg cursor-pointer hover:border-[var(--amarelo)]/50 transition-colors">
                    <input type="checkbox" className="accent-[var(--amarelo)] w-4 h-4" />
                    <span className="text-sm font-medium">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-lg font-bold">3. Logística e Documentação</h3>
              <p className="text-sm text-[--text-secondary] mb-4">Anexe as súmulas e ofícios (módulos não financeiros).</p>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[--text-secondary]">Ofício de Inscrição (PDF)</label>
                  <div className="border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition-colors">
                    <svg className="w-8 h-8 text-[--text-dim] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span className="text-sm font-bold text-[--text-main]">Clique para anexar</span>
                    <span className="text-xs text-[--text-secondary]">ou arraste o arquivo aqui</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[--text-secondary]">Observações Logísticas</label>
                  <textarea 
                    className="bg-[#111] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--amarelo)] transition-colors resize-none h-24"
                    placeholder="Ex: O ginásio da equipe estará em reforma até o mês 05..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="text-lg font-bold">4. Revisão</h3>
              <p className="text-sm text-[--text-secondary] mb-4">Confira os dados antes de finalizar a inscrição logística.</p>
              
              <div className="bg-[#111] rounded-xl p-4 border border-[rgba(255,255,255,0.05)] space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[--text-secondary] text-sm">Equipe</span>
                  <span className="font-bold text-sm text-[--text-main]">Sogipa</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[--text-secondary] text-sm">Campeonato</span>
                  <span className="font-bold text-sm text-[--text-main]">Estadual Base 2026</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[--text-secondary] text-sm">Categorias (3)</span>
                  <span className="font-bold text-sm text-[--text-main]">Sub 15, Sub 16, Sub 17</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[--text-secondary] text-sm">Ofício</span>
                  <span className="font-bold text-sm text-green-500">Anexado</span>
                </div>
              </div>

              <div className="bg-[var(--amarelo)]/10 border border-[var(--amarelo)]/20 p-4 rounded-xl flex items-start gap-3 mt-4">
                <svg className="w-5 h-5 text-[var(--amarelo)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs text-[var(--amarelo)]">Ao confirmar, a inscrição entrará como PENDENTE na área de moderação. A aprovação final não envolve pagamentos através da plataforma.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[rgba(255,255,255,0.05)] bg-[#0A0A0A] flex justify-between items-center rounded-b-xl">
          <button 
            disabled={step === 1}
            onClick={handleBack}
            className="text-sm font-bold text-[--text-secondary] hover:text-white px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Voltar
          </button>

          {step < 4 ? (
            <button 
              onClick={handleNext}
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm"
            >
              Próximo Passo
            </button>
          ) : (
            <button 
              onClick={handleClose}
              className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
            >
              Confirmar Inscrição
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
