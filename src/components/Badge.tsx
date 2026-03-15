import { cn } from "@/lib/utils"

type BadgeProps = {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "error" | "info" | "orange" | "blue" | "purple" | "pink"
  size?: "sm" | "default"
  withDot?: boolean
  className?: string
}

export function Badge({
  children,
  variant = "default",
  size = "default",
  withDot = false,
  className
}: BadgeProps) {
  const variantStyles = {
    default: "bg-white/5 text-slate-300 border-white/10 backdrop-blur-md",
    success: "bg-green-500/10 text-green-400 border-green-500/20 backdrop-blur-md",
    warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 backdrop-blur-md",
    error: "bg-red-500/10 text-red-500 border-red-500/20 backdrop-blur-md",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20 backdrop-blur-md",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20 backdrop-blur-md",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 backdrop-blur-md",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 backdrop-blur-md",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20 backdrop-blur-md",
  }

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-bold",
    default: "px-3.5 py-1 text-xs font-semibold tracking-wide",
  }

  const dotColor = {
    default: "bg-slate-400 shadow-[0_0_5px_rgba(148,163,184,0.5)] flex-shrink-0",
    success: "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)] flex-shrink-0",
    warning: "bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)] flex-shrink-0",
    error: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)] flex-shrink-0",
    info: "bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)] flex-shrink-0",
    orange: "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)] flex-shrink-0",
    blue: "bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)] flex-shrink-0",
    purple: "bg-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.5)] flex-shrink-0",
    pink: "bg-pink-400 shadow-[0_0_5px_rgba(236,72,153,0.5)] flex-shrink-0",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-all duration-300",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {withDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColor[variant])} />
      )}
      {children}
    </span>
  )
}
