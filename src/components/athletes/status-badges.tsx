import { cn } from '@/lib/utils'
import {
  ATHLETE_CBB_STATUS_META,
  ATHLETE_FEDERATION_STATUS_META,
  ATHLETE_REQUEST_STATUS_META,
  isPendingAthleteRequestStatus,
} from '@/lib/athlete-registration-presentation'

type BadgeProps = {
  className?: string
  status: string
}

function StatusBadge({
  status,
  className,
  meta,
}: BadgeProps & { meta: Record<string, { label: string; className: string }> }) {
  const resolved = meta[status] || {
    label: status,
    className: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest',
        resolved.className,
        className
      )}
    >
      {resolved.label}
    </span>
  )
}

export function AthleteRequestStatusBadge(props: BadgeProps) {
  return (
    <StatusBadge
      {...props}
      meta={ATHLETE_REQUEST_STATUS_META}
      className={cn(isPendingAthleteRequestStatus(props.status) && 'ring-2 ring-[var(--yellow)]/35 shadow-sm', props.className)}
    />
  )
}

export function AthleteCbbStatusBadge(props: BadgeProps) {
  return <StatusBadge {...props} meta={ATHLETE_CBB_STATUS_META} />
}

export function AthleteFederationStatusBadge(props: BadgeProps) {
  return <StatusBadge {...props} meta={ATHLETE_FEDERATION_STATUS_META} />
}
