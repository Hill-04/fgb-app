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
        "group relative overflow-hidden transition-all duration-300",
        "bg-white border border-[var(--border)] rounded-[20px]",
        "hover:shadow-premium hover:-translate-y-1.5",
        "flex flex-col h-full",
        className
      )}
    >
      {/* Visual Accent - Top Bar + Corner Glow */}
      <div className={cn("absolute top-0 left-0 w-full h-1.5", borderAccents[accent])} />
      <div className={cn("absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10 rounded-full -mr-12 -mt-12 transition-opacity group-hover:opacity-20", iconBgs[accent])} />

      <div className="p-7 flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 9, letterSpacing: '0.15em' }}>
              {label}
            </p>
            {sublabel && (
              <p className="text-[10px] font-medium text-[var(--gray)] opacity-70 leading-tight line-clamp-1">
                {sublabel}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-3 rounded-2xl flex items-center justify-center transition-all duration-300",
              "shadow-sm group-hover:shadow-md group-hover:scale-110 group-hover:rotate-3",
              iconBgs[accent]
            )}>
              {icon}
            </div>
          )}
        </div>

        <div className="mt-auto">
          <p className="fgb-display text-5xl text-[var(--black)] leading-none tracking-tight">
            {value}
          </p>
          <div className="w-10 h-1 bg-[var(--border)] mt-4 rounded-full transition-all duration-500 group-hover:w-20 group-hover:bg-[var(--verde)]" />
        </div>
      </div>
    </div>
  )
}
