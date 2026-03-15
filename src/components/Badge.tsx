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
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    error: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    pink: "bg-pink-50 text-pink-700 border-pink-200",
  }

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[10px] uppercase tracking-widest font-bold",
    default: "px-3.5 py-1 text-xs font-semibold tracking-wide",
  }

  const dotColor = {
    default: "bg-slate-400 shadow-sm flex-shrink-0",
    success: "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)] flex-shrink-0",
    warning: "bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.4)] flex-shrink-0",
    error: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.4)] flex-shrink-0",
    info: "bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.4)] flex-shrink-0",
    orange: "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.4)] flex-shrink-0",
    blue: "bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.4)] flex-shrink-0",
    purple: "bg-purple-400 shadow-[0_0_5px_rgba(168,85,247,0.4)] flex-shrink-0",
    pink: "bg-pink-400 shadow-[0_0_5px_rgba(236,72,153,0.4)] flex-shrink-0",
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
