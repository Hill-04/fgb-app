import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type FgbImageVariant = "cover" | "avatar" | "logo"
type FgbImageTint = "green" | "navy" | "yellow" | "red"

type FgbImageProps = {
  src?: string | null
  alt: string
  variant?: FgbImageVariant
  tint?: FgbImageTint
  icon?: LucideIcon
  initials?: string
  className?: string
}

const TINT_GRADIENTS: Record<FgbImageTint, string> = {
  green: "var(--fgb-gradient-court)",
  navy: "var(--fgb-gradient-night)",
  yellow: "var(--fgb-gradient-victory)",
  red: "var(--fgb-gradient-flame)",
}

const VARIANT_FIT: Record<FgbImageVariant, string> = {
  cover: "object-cover object-center",
  avatar: "object-cover object-top",
  logo: "object-contain p-2",
}

export function FgbImage({
  src,
  alt,
  variant = "cover",
  tint = "green",
  icon: Icon,
  initials,
  className,
}: FgbImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn("h-full w-full", VARIANT_FIT[variant], className)}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={{ background: TINT_GRADIENTS[tint] }}
    >
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0"
        style={{ height: 3, background: "var(--fgb-gradient-tricolor)" }}
      />
      {Icon && (
        <Icon
          aria-hidden
          size={variant === "avatar" ? 28 : 44}
          style={{ color: "rgba(255,255,255,0.55)", strokeWidth: 1.5 }}
        />
      )}
      {!Icon && initials && (
        <span
          aria-hidden
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: variant === "avatar" ? 26 : 64,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {initials}
        </span>
      )}
      {!Icon && !initials && (
        <span
          aria-hidden
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: variant === "avatar" ? 22 : 44,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.08em",
          }}
        >
          FGB
        </span>
      )}
    </div>
  )
}
