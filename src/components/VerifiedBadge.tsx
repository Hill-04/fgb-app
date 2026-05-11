import { BadgeCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type VerifiedBadgeProps = {
  /** Mostra o badge apenas se verified === true. Caso contrário, renderiza null. */
  verified?: boolean | null
  /** Variante de exibição. `pill` mostra ícone + texto; `icon` só o ícone (compacto). */
  variant?: "pill" | "icon"
  /** Tamanho. */
  size?: "sm" | "md" | "lg"
  /** Tom: `solid` (fundo verde, texto branco) ou `outline` (transparente, texto verde). */
  tone?: "solid" | "outline"
  /** Texto customizado (padrão "FGB Verificado"). */
  label?: string
  className?: string
  /** Texto acessível para screen readers. */
  ariaLabel?: string
}

const SIZE_TOKENS = {
  sm: { padding: "2px 8px 2px 6px", fontSize: 9, iconSize: 10, iconOnly: 14, gap: 4 },
  md: { padding: "3px 10px 3px 8px", fontSize: 10, iconSize: 12, iconOnly: 16, gap: 5 },
  lg: { padding: "5px 14px 5px 10px", fontSize: 11, iconSize: 14, iconOnly: 20, gap: 6 },
} as const

export function VerifiedBadge({
  verified,
  variant = "pill",
  size = "md",
  tone = "solid",
  label = "FGB Verificado",
  className,
  ariaLabel,
}: VerifiedBadgeProps) {
  if (!verified) return null

  const tokens = SIZE_TOKENS[size]
  const a11y = ariaLabel ?? label

  if (variant === "icon") {
    return (
      <span
        className={cn("inline-flex items-center justify-center", className)}
        style={{
          width: tokens.iconOnly,
          height: tokens.iconOnly,
          borderRadius: "50%",
          background: tone === "solid" ? "var(--fgb-green-700)" : "transparent",
          color: tone === "solid" ? "#fff" : "var(--fgb-green-700)",
          border: tone === "outline" ? "1.5px solid var(--fgb-green-700)" : "none",
        }}
        role="img"
        aria-label={a11y}
        title={a11y}
      >
        <BadgeCheck
          size={tokens.iconSize}
          strokeWidth={2.5}
          aria-hidden
        />
      </span>
    )
  }

  return (
    <span
      className={cn("inline-flex items-center fgb-label", className)}
      style={{
        background: tone === "solid" ? "var(--fgb-green-700)" : "transparent",
        color: tone === "solid" ? "#fff" : "var(--fgb-green-700)",
        border: tone === "outline" ? "1px solid var(--fgb-green-300)" : "none",
        padding: tokens.padding,
        fontSize: tokens.fontSize,
        gap: tokens.gap,
        letterSpacing: "0.18em",
        fontWeight: 700,
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
      role="img"
      aria-label={a11y}
      title={a11y}
    >
      <BadgeCheck size={tokens.iconSize} strokeWidth={2.5} aria-hidden />
      {label}
    </span>
  )
}
