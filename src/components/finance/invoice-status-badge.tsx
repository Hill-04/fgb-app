import { getInvoiceStatusClassName, getInvoiceStatusLabel } from '@/lib/finance'
import { cn } from '@/lib/utils'

type InvoiceStatusBadgeProps = {
  status: string
  className?: string
}

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] shadow-sm',
        getInvoiceStatusClassName(status),
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {getInvoiceStatusLabel(status)}
    </span>
  )
}
