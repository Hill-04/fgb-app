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
    orange: "from-orange-50 to-transparent",
    blue: "from-blue-50 to-transparent",
    green: "from-green-50 to-transparent",
    purple: "from-purple-50 to-transparent",
    pink: "from-pink-50 to-transparent",
  }

  const borderAccents = {
    orange: "border-t-orange-500",
    blue: "border-t-blue-500",
    green: "border-t-green-500",
    purple: "border-t-purple-500",
    pink: "border-t-pink-500",
  }

  const iconBgs = {
    orange: "bg-orange-100 text-orange-600 shadow-sm",
    blue: "bg-blue-100 text-blue-600 shadow-sm",
    green: "bg-green-100 text-green-600 shadow-sm",
    purple: "bg-purple-100 text-purple-600 shadow-sm",
    pink: "bg-pink-100 text-pink-600 shadow-sm",
  }

  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-slate-300",
        borderAccents[accent],
        "border-t-[3px]",
        className
      )}
    >
      {/* Subtle background gradient based on accent */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none transition-opacity duration-500 group-hover:opacity-100", accentGradients[accent])} />
      
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          {label}
        </div>
        {icon && (
          <div className={cn("p-2.5 rounded-[12px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110", iconBgs[accent])}>
            {icon}
          </div>
        )}
      </div>

      <div className="relative z-10">
        <div className="font-display font-black text-4xl text-slate-900 tracking-tight leading-none mb-2">
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
