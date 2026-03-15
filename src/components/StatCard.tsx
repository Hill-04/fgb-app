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
    orange: "from-orange-500/20 to-transparent text-orange-500",
    blue: "from-blue-500/20 to-transparent text-blue-500",
    green: "from-green-500/20 to-transparent text-green-500",
    purple: "from-purple-500/20 to-transparent text-purple-500",
    pink: "from-pink-500/20 to-transparent text-pink-500",
  }

  const borderAccents = {
    orange: "border-t-orange-500",
    blue: "border-t-blue-500",
    green: "border-t-green-500",
    purple: "border-t-purple-500",
    pink: "border-t-pink-500",
  }

  const iconBgs = {
    orange: "bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]",
    blue: "bg-blue-500/10 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
    green: "bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
    purple: "bg-purple-500/10 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    pink: "bg-pink-500/10 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.15)]",
  }

  return (
    <div
      className={cn(
        "bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:bg-white/[0.04]",
        borderAccents[accent],
        "border-t-2",
        className
      )}
    >
      {/* Inner subtle glow */}
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5 pointer-events-none" />

      {/* Subtle background gradient based on accent */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none transition-opacity duration-500 group-hover:opacity-100", accentGradients[accent])} />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {label}
        </div>
        {icon && (
          <div className={cn("p-2.5 rounded-[12px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-white/10", iconBgs[accent])}>
            {icon}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div className="font-display font-black text-4xl text-white tracking-tight leading-none mb-2 drop-shadow-md">
          {value}
        </div>
        {sublabel && (
          <div className="text-sm font-medium text-slate-500 mt-1">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
