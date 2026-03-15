import { cn } from "@/lib/utils"

type SectionProps = {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function Section({ title, subtitle, children, className, action }: SectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-end justify-between border-b border-[rgba(255,255,255,0.1)] pb-4">
        <div>
          <h2 className="text-2xl font-black text-[--text-main] tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-sm font-medium text-[--text-secondary] mt-1">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="pb-1">
            {action}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}
