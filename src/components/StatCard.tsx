import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  sublabel?: string
  accent?: "orange" | "blue" | "green" | "purple" | "pink" | "verde" | "yellow" | "red"
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  sublabel,
  accent = "verde",
  icon,
  className
}: StatCardProps) {
  // Top border accent color
  const borderAccents: Record<string, string> = {
    verde:  "border-t-[var(--verde)]",
    yellow: "border-t-[var(--yellow)]",
    red:    "border-t-[var(--red)]",
    orange: "border-t-[var(--orange)]",
    blue:   "border-t-[#3B82F6]",
    green:  "border-t-[var(--verde)]",
    purple: "border-t-[#8B5CF6]",
    pink:   "border-t-[#EC4899]",
  }

  // Icon bg + color
  const iconBgs: Record<string, string> = {
    verde:  "bg-[var(--verde)]/10 text-[var(--verde)]",
    yellow: "bg-[var(--yellow)]/20 text-[var(--black)]",
    red:    "bg-[var(--red)]/10 text-[var(--red)]",
    orange: "bg-[var(--orange)]/10 text-[var(--orange)]",
    blue:   "bg-[#3B82F6]/10 text-[#3B82F6]",
    green:  "bg-[var(--verde)]/10 text-[var(--verde)]",
    purple: "bg-[#8B5CF6]/10 text-[#8B5CF6]",
    pink:   "bg-[#EC4899]/10 text-[#EC4899]",
  }

  return (
    <div
      className={cn(
        "fgb-card bg-white p-6 relative overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        borderAccents[accent],
        "border-t-[3px]",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9 }}>
          {label}
        </p>
        {icon && (
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105", iconBgs[accent])}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <p className="fgb-display text-4xl text-[var(--black)] leading-none mb-1">
          {value}
        </p>
        {sublabel && (
          <p className="fgb-label text-[var(--gray)] mt-2" style={{ fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}
