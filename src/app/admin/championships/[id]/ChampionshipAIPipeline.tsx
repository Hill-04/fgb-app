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
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      {AI_STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isCurrent = currentStep === step.id
        const isFuture = currentStep < step.id

        const Icon = step.icon

        return (
          <div
            key={step.id}
            className={cn(
              "relative p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden group",
              isCurrent 
                ? "bg-white/[0.03] border-[#FF6B00]/40 shadow-[0_0_30px_rgba(255,107,0,0.1)] -translate-y-2" 
                : isCompleted 
                  ? "bg-white/[0.01] border-green-500/20" 
                  : "bg-white/[0.01] border-white/5 opacity-40 grayscale"
            )}
          >
            {/* Background Glow */}
            {isCurrent && (
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#FF6B00]/10 rounded-full blur-2xl animate-pulse" />
            )}

            <div className="relative z-10 flex flex-col items-center text-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                isCurrent ? "bg-[#FF6B00] text-white rotate-6" : 
                isCompleted ? "bg-green-500/10 text-green-500" : "bg-white/5 text-slate-700"
              )}>
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>

              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">{step.description}</p>
                <h4 className={cn(
                  "text-sm font-display font-black uppercase tracking-tight",
                  isCurrent ? "text-white" : "text-slate-400"
                )}>{step.title}</h4>
              </div>
            </div>

            {/* Step Number Badge */}
            <div className="absolute top-4 left-4 text-[40px] font-display font-black text-white/[0.02] leading-none pointer-events-none">
              {step.id}
            </div>

            {/* Progress Bar (Desktop only) */}
            {index < AI_STEPS.length - 1 && (
               <div className="hidden lg:block absolute top-1/2 -right-2 w-4 h-px bg-white/10 z-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}
