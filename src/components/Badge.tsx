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
    default: "bg-white/5 text-[--text-secondary] border-white/10 backdrop-blur-md shadow-inner",
    success: "bg-[--success]/10 text-[--success] border-[--success]/20 backdrop-blur-md shadow-[0_0_10px_rgba(34,197,94,0.1)]",
    warning: "bg-[--warning]/10 text-[--warning] border-[--warning]/20 backdrop-blur-md shadow-[0_0_10px_rgba(234,179,8,0.1)]",
    error: "bg-[--error]/10 text-[--error] border-[--error]/20 backdrop-blur-md shadow-[0_0_10px_rgba(239,68,68,0.1)]",
    info: "bg-[--blue-admin]/10 text-[--blue-light] border-[--blue-admin]/20 backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    orange: "bg-[--orange]/10 text-[--orange] border-[--orange]/20 backdrop-blur-md shadow-[0_0_10px_rgba(249,115,22,0.1)]",
    blue: "bg-[--blue-admin]/10 text-[--blue-light] border-[--blue-admin]/20 backdrop-blur-md shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    purple: "bg-[--purple-ai]/10 text-[--purple-ai] border-[--purple-ai]/20 backdrop-blur-md shadow-[0_0_10px_rgba(168,85,247,0.1)]",
    pink: "bg-[--pink-female]/10 text-[--pink-female] border-[--pink-female]/20 backdrop-blur-md shadow-[0_0_10px_rgba(236,72,153,0.1)]",
  }

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold",
    default: "px-3.5 py-1 text-xs font-semibold tracking-wide",
  }

  const dotColor = {
    default: "bg-[--text-secondary] shadow-[0_0_5px_rgba(148,163,184,0.5)]",
    success: "bg-[--success] shadow-[0_0_5px_rgba(34,197,94,0.5)]",
    warning: "bg-[--warning] shadow-[0_0_5px_rgba(234,179,8,0.5)]",
    error: "bg-[--error] shadow-[0_0_5px_rgba(239,68,68,0.5)]",
    info: "bg-[--blue-light] shadow-[0_0_5px_rgba(96,165,250,0.5)]",
    orange: "bg-[--orange] shadow-[0_0_5px_rgba(249,115,22,0.5)]",
    blue: "bg-[--blue-light] shadow-[0_0_5px_rgba(96,165,250,0.5)]",
    purple: "bg-[--purple-ai] shadow-[0_0_5px_rgba(168,85,247,0.5)]",
    pink: "bg-[--pink-female] shadow-[0_0_5px_rgba(236,72,153,0.5)]",
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
