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
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="label-uppercase text-[--text-dim]">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[--text-secondary] mt-1">{subtitle}</p>
          )}
        </div>
        {action && action}
      </div>
      <div>{children}</div>
    </div>
  )
}
