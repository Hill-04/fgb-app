import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type FinancePageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  badge?: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export function FinancePageHeader({
  eyebrow,
  title,
  description,
  badge,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: FinancePageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[38px] border border-[var(--border)] bg-[var(--black)] p-6 text-white shadow-premium md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,194,0,0.24),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(27,115,64,0.44),transparent_34%)]" />
      <div className="pointer-events-none absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-white/10 md:block" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--yellow)]">
              {eyebrow}
            </span>
            {badge ? (
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
                {badge}
              </span>
            ) : null}
          </div>
          <h1 className="fgb-display max-w-4xl text-4xl leading-none text-white md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-white/68">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {primaryHref && primaryLabel ? (
            <Link href={primaryHref} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--yellow)] px-5 text-[10px] font-black uppercase tracking-widest text-[var(--black)] transition hover:-translate-y-0.5">
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white/15">
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  )
}
