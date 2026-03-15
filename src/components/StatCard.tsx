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
    orange: "from-[#FF6B00]/10 to-transparent",
    blue: "from-[#3B82F6]/10 to-transparent",
    green: "from-[#10B981]/10 to-transparent",
    purple: "from-[#8B5CF6]/10 to-transparent",
    pink: "from-[#EC4899]/10 to-transparent",
  }

  const borderAccents = {
    orange: "border-t-[#FF6B00]",
    blue: "border-t-[#3B82F6]",
    green: "border-t-[#10B981]",
    purple: "border-t-[#8B5CF6]",
    pink: "border-t-[#EC4899]",
  }

  const iconBgs = {
    orange: "bg-[#FF6B00]/20 text-[#FF6B00] shadow-sm",
    blue: "bg-[#3B82F6]/20 text-[#60A5FA] shadow-sm",
    green: "bg-[#10B981]/20 text-[#10B981] shadow-sm",
    purple: "bg-[#8B5CF6]/20 text-[#A78BFA] shadow-sm",
    pink: "bg-[#EC4899]/20 text-[#F472B6] shadow-sm",
  }

  return (
    <div
      className={cn(
        "glass-panel rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(255,255,255,0.2)]",
        borderAccents[accent],
        "border-t-[3px]",
        className
      )}
    >
      {/* Subtle background gradient based on accent */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none transition-opacity duration-500 group-hover:opacity-100", accentGradients[accent])} />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="text-[11px] font-bold text-[--text-secondary] uppercase tracking-widest">
          {label}
        </div>
        {icon && (
          <div className={cn("p-2.5 rounded-[12px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110", iconBgs[accent])}>
            {icon}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div className="font-display font-black text-4xl text-[--text-main] tracking-tight leading-none mb-2">
          {value}
        </div>
        {sublabel && (
          <div className="text-sm font-medium text-[--text-secondary] mt-1">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}
