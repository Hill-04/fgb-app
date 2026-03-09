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
              "flex-1 min-w-[140px] card-fgb p-4 relative",
              isCurrent && "border-[--warning]",
              isCompleted && "border-[--success]",
              isFuture && "opacity-50"
            )}
          >
            {/* Status Badge */}
            <div
              className={cn(
                "absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                isCompleted && "bg-[--success] text-white",
                isCurrent && "bg-[--warning] text-white",
                isFuture && "bg-[--border-color] text-[--text-dim]"
              )}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : step.id}
            </div>

            <div className="space-y-1">
              <div className="label-uppercase text-[--text-dim]">
                {step.description}
              </div>
              <div className="text-lg font-bold text-[--text-main]">
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
