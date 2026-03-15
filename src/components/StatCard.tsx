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
  const accentGradients = {
    orange: "from-[--orange]/20 to-transparent text-[--orange]",
    blue: "from-[--blue-admin]/20 to-transparent text-[--blue-admin]",
    green: "from-[--success]/20 to-transparent text-[--success]",
    purple: "from-[--purple-ai]/20 to-transparent text-[--purple-ai]",
    pink: "from-[--pink-female]/20 to-transparent text-[--pink-female]",
  }

  const borderAccents = {
    orange: "border-t-[--orange]",
    blue: "border-t-[--blue-admin]",
    green: "border-t-[--success]",
    purple: "border-t-[--purple-ai]",
    pink: "border-t-[--pink-female]",
  }

  const iconBgs = {
    orange: "bg-[--orange]/10 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
    blue: "bg-[--blue-admin]/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    green: "bg-[--success]/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
    purple: "bg-[--purple-ai]/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    pink: "bg-[--pink-female]/10 shadow-[0_0_15px_rgba(236,72,153,0.15)]",
  }

  return (
    <div
      className={cn(
        "glass-panel p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1",
        borderAccents[accent],
        "border-t-2", // Replaces border-l-4 with a sleek top border
        className
      )}
    >
      {/* Subtle background gradient based on accent */}
      <div className={cn("absolute inset-0 bg-gradient-to-b opacity-50 pointer-events-none transition-opacity group-hover:opacity-100", accentGradients[accent])} />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="label-uppercase text-[--text-secondary] tracking-wider">
          {label}
        </div>
        {icon && (
          <div className={cn("p-2 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", iconBgs[accent])}>
            {icon}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div className="text-4xl font-black text-[--text-main] tracking-tight mb-1 drop-shadow-sm">
          {value}
        </div>
        {sublabel && (
          <div className="text-sm font-medium text-[--text-dim]">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
