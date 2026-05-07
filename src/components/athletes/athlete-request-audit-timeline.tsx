'use client'

import { getAthleteAuditActionMeta } from '@/lib/athlete-registration-presentation'
import { cn } from '@/lib/utils'

type AuditTimelineItem = {
  id: string
  action: string
  description: string
  createdAt: string | Date
  createdByUser?: {
    id: string
    name: string | null
  } | null
}

export function AthleteRequestAuditTimeline({
  items,
}: {
  items: AuditTimelineItem[]
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--gray)]">
        Nenhuma ação registrada ainda.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const meta = getAthleteAuditActionMeta(item.action)

        return (
          <div key={item.id} className="flex gap-3">
            <div className="flex w-5 flex-col items-center">
              <span className={cn('mt-1 h-3 w-3 rounded-full border-2 border-white shadow-sm', meta.tone)} />
              {index < items.length - 1 ? <span className="mt-1 w-px flex-1 bg-[var(--border)]" /> : null}
            </div>
            <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest',
                    meta.tone
                  )}
                >
                  {meta.label}
                </span>
                <span className="text-[10px] text-[var(--gray)]">
                  {new Date(item.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--gray)]">{item.description}</p>
              {item.createdByUser?.name ? (
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--gray)]">
                  {item.createdByUser.name}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
