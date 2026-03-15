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
    default: "bg-white/5 text-[--text-main] border-[--border-color]",
    success: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
    error: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20",
    info: "bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/20",
    orange: "bg-[#FF6B00]/10 text-[#FF6B00] border-[#FF6B00]/20",
    blue: "bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/20",
    purple: "bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/20",
    pink: "bg-[#EC4899]/10 text-[#F472B6] border-[#EC4899]/20",
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
