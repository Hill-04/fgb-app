import Link from "next/link"
import { cn } from "@/lib/utils"
import { VerifiedBadge } from "@/components/VerifiedBadge"

type AthleteCardProps = {
  name: string
  position?: string
  team?: string
  jerseyNumber?: number | string | null
  photoUrl?: string | null
  href?: string
  className?: string
  verified?: boolean | null
}

export function AthleteCard({
  name,
  position,
  team,
  jerseyNumber,
  photoUrl,
  href,
  className,
  verified,
}: AthleteCardProps) {
  const content = (
    <article
      className={cn(
        "group relative aspect-square overflow-hidden text-white",
        className,
      )}
      style={{ background: "var(--fgb-green-900)" }}
    >
      {jerseyNumber !== null && jerseyNumber !== undefined && jerseyNumber !== "" && (
        <span
          aria-hidden
          className="pointer-events-none absolute select-none leading-none"
          style={{
            bottom: -32,
            right: -16,
            fontFamily: "var(--font-stencil)",
            fontSize: 280,
            color: "rgba(255,255,255,0.08)",
          }}
        >
          {jerseyNumber}
        </span>
      )}

      <span
        aria-hidden
        className="absolute top-0 left-0 bottom-0"
        style={{ width: 4, background: "var(--fgb-gradient-tricolor)" }}
      />

      {verified && (
        <div className="absolute top-3 right-3 z-10">
          <VerifiedBadge verified variant="icon" size="md" tone="solid" />
        </div>
      )}

      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "var(--fgb-gradient-court)" }}
        >
          <span
            style={{
              fontFamily: "var(--font-anton)",
              fontSize: 96,
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {name[0]?.toUpperCase()}
          </span>
        </div>
      )}

      <div
        className="absolute inset-x-0 bottom-0 p-5"
        style={{
          background:
            "linear-gradient(to top, var(--fgb-green-900) 0%, rgba(8,60,30,0.7) 50%, transparent 100%)",
        }}
      >
        {position && (
          <div
            className="fgb-label"
            style={{ color: "var(--fgb-yellow-500)", fontSize: 11, letterSpacing: "0.2em" }}
          >
            {position}
          </div>
        )}
        <div
          className="mt-1"
          style={{
            fontFamily: "var(--font-anton)",
            fontSize: 28,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "0.01em",
          }}
        >
          {name}
        </div>
        {team && (
          <div
            className="mt-1.5 fgb-label"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 10,
              letterSpacing: "0.18em",
            }}
          >
            {team}
          </div>
        )}
      </div>
    </article>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}
