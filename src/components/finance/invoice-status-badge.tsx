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
        'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
        getInvoiceStatusClassName(status),
        className
      )}
    >
      {getInvoiceStatusLabel(status)}
    </span>
  )
}
