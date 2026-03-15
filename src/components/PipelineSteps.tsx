"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

type Step = {
  id: number
  title: string
  description: string
  href?: string
}

const STEPS: Step[] = [
  { id: 1, title: "Criar", description: "Campeonato", href: "/admin/championships" },
  { id: 2, title: "Inscrições", description: "Abertas", href: "/admin/championships" },
  { id: 3, title: "Validar", description: "Categorias", href: "/admin/validation" },
  { id: 4, title: "IA", description: "Organizar", href: "/admin/scheduling" },
  { id: 5, title: "Revisar", description: "Confirmar", href: "/admin/review" },
  { id: 6, title: "Enviar", description: "Documentos", href: "/admin/reports" },
]

type PipelineStepsProps = {
  currentStep: number
  className?: string
}

export function PipelineSteps({ currentStep, className }: PipelineStepsProps) {
  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2", className)}>
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id
        const isCurrent = currentStep === step.id
        const isFuture = currentStep < step.id

        return (
          <div
            key={step.id}
            className={cn(
              "flex-1 min-w-[140px] glass-panel p-5 relative transition-all duration-300",
              isCurrent && "border-[--warning]/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] -translate-y-1",
              isCompleted && "border-[--success]/50",
              isFuture && "opacity-50 grayscale"
            )}
          >
            {/* Status Badge */}
            <div
              className={cn(
                "absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg",
                isCompleted && "bg-[--success] text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]",
                isCurrent && "bg-[--warning] text-[#3f2b00] shadow-[0_0_10px_rgba(234,179,8,0.5)]",
                isFuture && "bg-[--border-color] text-[--text-dim] border border-slate-200"
              )}
            >
              {isCompleted ? <Check className="w-4 h-4" strokeWidth={3} /> : step.id}
            </div>

            <div className="space-y-1.5 mt-1">
              <div className="label-uppercase text-[--text-secondary] tracking-widest text-[9px]">
                {step.description}
              </div>
              <div className={cn("text-lg font-black tracking-tight", 
                isCurrent ? "text-[--warning]" : isCompleted ? "text-[--text-main]" : "text-[--text-dim]"
              )}>
                {step.title}
              </div>
            </div>

            {/* Connector */}
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "absolute top-1/2 -right-3 w-6 h-0.5",
                  isCompleted ? "bg-[--success]" : "bg-[--border-color]"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
