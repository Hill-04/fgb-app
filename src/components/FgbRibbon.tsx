import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type FgbRibbonVariant = "verde" | "amarelo" | "vermelho" | "navy"
type FgbRibbonSize = "sm" | "md"

type FgbRibbonProps = {
  children: React.ReactNode
  variant?: FgbRibbonVariant
  size?: FgbRibbonSize
  icon?: LucideIcon
  pulse?: boolean
  className?: string
}

const VARIANT_BG: Record<FgbRibbonVariant, string> = {
  verde: "var(--fgb-green-700)",
  amarelo: "var(--fgb-yellow-500)",
  vermelho: "var(--fgb-red-500)",
  navy: "var(--fgb-navy-700)",
}

const VARIANT_FG: Record<FgbRibbonVariant, string> = {
  verde: "#fff",
  amarelo: "var(--fgb-ink-900)",
  vermelho: "#fff",
  navy: "#fff",
}

const SIZE_TOKENS: Record<
  FgbRibbonSize,
  { padding: string; fontSize: number; iconSize: number; tip: number }
> = {
  sm: { padding: "4px 16px 4px 10px", fontSize: 9, iconSize: 10, tip: 8 },
  md: { padding: "6px 22px 6px 14px", fontSize: 11, iconSize: 12, tip: 10 },
}

export function FgbRibbon({
  children,
  variant = "verde",
  size = "md",
  icon: Icon,
  pulse = false,
  className,
}: FgbRibbonProps) {
  const tokens = SIZE_TOKENS[size]

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 fgb-label", className)}
      style={{
        background: VARIANT_BG[variant],
        color: VARIANT_FG[variant],
        fontSize: tokens.fontSize,
        padding: tokens.padding,
        letterSpacing: "0.2em",
        fontWeight: 800,
        // Ribbon angular: ponta direita, retângulo à esquerda
        clipPath: `polygon(0 0, calc(100% - ${tokens.tip}px) 0, 100% 50%, calc(100% - ${tokens.tip}px) 100%, 0 100%)`,
        animation: pulse ? "fgb-pulse 1.4s ease-in-out infinite" : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {Icon && <Icon size={tokens.iconSize} aria-hidden style={{ strokeWidth: 2.5 }} />}
      {children}
    </span>
  )
}
