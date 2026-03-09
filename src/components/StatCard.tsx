import { cn } from "@/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  sublabel?: string
  accent?: "orange" | "blue" | "green" | "purple" | "pink"
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  sublabel,
  accent = "orange",
  icon,
  className
}: StatCardProps) {
  const accentColors = {
    orange: "border-l-[--orange]",
    blue: "border-l-[--blue-admin]",
    green: "border-l-[--success]",
    purple: "border-l-[--purple-ai]",
    pink: "border-l-[--pink-female]",
  }

  return (
    <div
      className={cn(
        "card-fgb p-6 border-l-4",
        accentColors[accent],
        className
      )}
    >
      {icon && (
        <div className="mb-3 text-[--text-secondary]">
          {icon}
        </div>
      )}
      <div className="label-uppercase text-[--text-dim] mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold text-[--text-main] mb-1">
        {value}
      </div>
      {sublabel && (
        <div className="text-sm text-[--text-secondary]">
          {sublabel}
        </div>
      )}
    </div>
  )
}
