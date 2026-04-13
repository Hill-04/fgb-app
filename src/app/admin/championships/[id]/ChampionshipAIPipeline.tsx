"use client"

import { cn } from "@/lib/utils"
import { Check, Sparkles, AlertCircle, Calendar, Users, MapPin, Zap } from "lucide-react"

type Step = {
  id: number
  title: string
  description: string
  icon: any
}

const AI_STEPS: Step[] = [
  { id: 1, title: "Validar", description: "Inscrições", icon: Users },
  { id: 2, title: "Categorias", description: "Viabilidade", icon: AlertCircle },
  { id: 3, title: "Agrupar", description: "Blocos", icon: Zap },
  { id: 4, title: "Gerar", description: "Confrontos", icon: Calendar },
  { id: 5, title: "Otimizar", description: "Logística", icon: MapPin },
  { id: 6, title: "Publicar", description: "Agenda", icon: Sparkles },
]

type Props = {
  currentStep: number
  className?: string
}

export function ChampionshipAIPipeline({ currentStep, className }: Props) {
  const progress = Math.max(0, Math.min(100, Math.round((currentStep / AI_STEPS.length) * 100)))

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gray)]">
        <span>Processo IA</span>
        <span className="text-[var(--verde)]">{progress}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--gray-l)]/80 border border-[var(--border)] overflow-hidden">
        <div
          className="h-full bg-[linear-gradient(90deg,var(--amarelo),var(--orange-dark),var(--red))] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {AI_STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isCurrent = currentStep === step.id
        const isFuture = currentStep < step.id

        const Icon = step.icon

        return (
          <div
            key={step.id}
            className={cn(
              "relative p-5 rounded-[22px] border transition-all duration-500 overflow-hidden group",
              isCurrent
                ? "bg-white border-[var(--amarelo)] shadow-[0_0_30px_rgba(255,193,7,0.18)] -translate-y-1"
                : isCompleted
                  ? "bg-white border-green-200"
                  : "bg-white/70 border-[var(--border)] opacity-70"
            )}
          >
            {isCurrent && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,193,7,0.25),transparent_60%)]" />
            )}

            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                isCurrent ? "bg-[var(--amarelo)] text-[var(--black)] rotate-3" :
                isCompleted ? "bg-green-50 text-green-600" : "bg-[var(--gray-l)] text-[var(--gray)]"
              )}>
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[var(--gray)] mb-1">
                  {step.description}
                </p>
                <h4 className={cn(
                  "text-sm font-display font-black uppercase tracking-tight",
                  isCurrent ? "text-[var(--black)]" : "text-[var(--gray)]"
                )}>{step.title}</h4>
              </div>
            </div>

            <div className="absolute top-4 left-4 text-[36px] font-display font-black text-[var(--gray-l)] leading-none pointer-events-none">
              {step.id}
            </div>

            {index < AI_STEPS.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-[var(--border)] z-0" />
            )}
          </div>
        )
      })}
      </div>
    </div>
  )
}
