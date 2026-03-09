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
    default: "bg-[--border-color] text-[--text-secondary]",
    success: "bg-[--success]/20 text-[--success] border-[--success]/30",
    warning: "bg-[--warning]/20 text-[--warning] border-[--warning]/30",
    error: "bg-[--error]/20 text-[--error] border-[--error]/30",
    info: "bg-[--blue-admin]/20 text-[--blue-light] border-[--blue-admin]/30",
    orange: "bg-[--orange]/20 text-[--orange] border-[--orange]/30",
    blue: "bg-[--blue-admin]/20 text-[--blue-light] border-[--blue-admin]/30",
    purple: "bg-[--purple-ai]/20 text-[--purple-ai] border-[--purple-ai]/30",
    pink: "bg-[--pink-female]/20 text-[--pink-female] border-[--pink-female]/30",
  }

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    default: "px-3 py-1 text-xs",
  }

  const dotColor = {
    default: "bg-[--text-secondary]",
    success: "bg-[--success]",
    warning: "bg-[--warning]",
    error: "bg-[--error]",
    info: "bg-[--blue-light]",
    orange: "bg-[--orange]",
    blue: "bg-[--blue-light]",
    purple: "bg-[--purple-ai]",
    pink: "bg-[--pink-female]",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {withDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColor[variant])} />
      )}
      {children}
    </span>
  )
}
