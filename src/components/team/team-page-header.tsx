import type { ReactNode } from 'react'

type EyebrowTone = 'gray' | 'green' | 'yellow'

const EYEBROW_TONE_CLASS: Record<EyebrowTone, string> = {
  gray: 'text-[var(--gray)]',
  green: 'text-[var(--verde)]',
  yellow: 'text-fgb-yellow-600',
}

type TeamPageHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  badge?: string
  icon?: ReactNode
  eyebrowTone?: EyebrowTone
  actions?: ReactNode
}

export function TeamPageHeader({
  eyebrow,
  title,
  description,
  badge,
  icon,
  eyebrowTone = 'gray',
  actions,
}: TeamPageHeaderProps) {
  return (
    <section className="animate-fade-in border-b border-[var(--border)] pb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {icon ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-fgb-yellow-100 bg-fgb-yellow-50 text-fgb-yellow-600">
                {icon}
              </span>
            ) : null}
            <span className={`fgb-label text-[10px] tracking-widest ${EYEBROW_TONE_CLASS[eyebrowTone]}`}>
              {eyebrow}
            </span>
            {badge ? (
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                {badge}
              </span>
            ) : null}
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight italic uppercase text-[var(--black)] md:text-5xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm font-medium text-[var(--gray)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  )
}
