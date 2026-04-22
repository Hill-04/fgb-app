import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'

type FinanceEmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
}

export function FinanceEmptyState({ icon: Icon, title, description, actionHref, actionLabel }: FinanceEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-dashed border-[var(--border)] bg-white p-8 text-center shadow-sm">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,194,0,0.12),transparent_36%)]" />
      <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--gray-l)] text-[var(--verde)]">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="fgb-display relative mt-5 text-2xl leading-none text-[var(--black)]">{title}</h3>
      <p className="relative mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-[var(--gray)]">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="relative mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--black)] px-5 text-[10px] font-black uppercase tracking-widest text-white transition hover:-translate-y-0.5 hover:bg-black/85"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}
