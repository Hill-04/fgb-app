export const ATHLETE_REQUEST_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: { label: 'Rascunho', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  SUBMITTED: { label: 'Enviada', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  UNDER_REVIEW: { label: 'Em análise', className: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
  CBB_CHECK_PENDING: {
    label: 'CBB pendente',
    className: 'border-orange-200 bg-orange-50 text-orange-700',
  },
  CBB_CHECKED: { label: 'CBB conferida', className: 'border-green-200 bg-green-50 text-green-700' },
  APPROVED: {
    label: 'Aprovada',
    className: 'border-[var(--verde)]/20 bg-[var(--verde)]/10 text-[var(--verde)]',
  },
  REJECTED: {
    label: 'Rejeitada',
    className: 'border-[var(--red)]/20 bg-[var(--red)]/10 text-[var(--red)]',
  },
  CANCELLED: { label: 'Cancelada', className: 'border-slate-200 bg-slate-50 text-slate-500' },
}

export const ATHLETE_CBB_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: 'Pendente', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  CHECKED: { label: 'Conferida', className: 'border-green-200 bg-green-50 text-green-700' },
}

export const ATHLETE_FEDERATION_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Ativo', className: 'border-[var(--verde)]/20 bg-[var(--verde)]/10 text-[var(--verde)]' },
  INACTIVE: { label: 'Inativo', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  SUSPENDED: { label: 'Suspenso', className: 'border-[var(--red)]/20 bg-[var(--red)]/10 text-[var(--red)]' },
  TRANSFERRED_OUT: {
    label: 'Transferido',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  },
}

export const ATHLETE_REQUEST_STATUS_PRIORITY: Record<string, number> = {
  CBB_CHECK_PENDING: 0,
  CBB_CHECKED: 1,
  SUBMITTED: 2,
  UNDER_REVIEW: 3,
  DRAFT: 4,
  APPROVED: 5,
  REJECTED: 6,
  CANCELLED: 7,
}

export const ATHLETE_AUDIT_ACTION_META: Record<
  string,
  { label: string; tone: string }
> = {
  REQUEST_CREATED: {
    label: 'Solicitação criada',
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  REQUEST_UPDATED: {
    label: 'Rascunho atualizado',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  REQUEST_SUBMITTED: {
    label: 'Solicitação enviada',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  REQUEST_CANCELLED: {
    label: 'Solicitação cancelada',
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
  },
  CBB_CHECK_UPDATED: {
    label: 'Conferência CBB',
    tone: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  },
  REQUEST_APPROVED: {
    label: 'Solicitação aprovada',
    tone: 'border-[var(--verde)]/20 bg-[var(--verde)]/10 text-[var(--verde)]',
  },
  REQUEST_REJECTED: {
    label: 'Solicitação rejeitada',
    tone: 'border-[var(--red)]/20 bg-[var(--red)]/10 text-[var(--red)]',
  },
}

export function formatAthleteDate(value?: string | Date | null) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('pt-BR')
}

export function isPendingAthleteRequestStatus(status: string) {
  return ['SUBMITTED', 'UNDER_REVIEW', 'CBB_CHECK_PENDING', 'CBB_CHECKED'].includes(status)
}

export function sortAthleteRequestsByStatus<T extends { status: string; createdAt: Date | string }>(
  requests: T[]
) {
  return [...requests].sort((left, right) => {
    const leftPriority = ATHLETE_REQUEST_STATUS_PRIORITY[left.status] ?? 99
    const rightPriority = ATHLETE_REQUEST_STATUS_PRIORITY[right.status] ?? 99
    if (leftPriority !== rightPriority) return leftPriority - rightPriority

    const leftDate = new Date(left.createdAt).getTime()
    const rightDate = new Date(right.createdAt).getTime()
    return rightDate - leftDate
  })
}

export function getAthleteAuditActionMeta(action: string) {
  return (
    ATHLETE_AUDIT_ACTION_META[action] || {
      label: action,
      tone: 'border-slate-200 bg-slate-50 text-slate-700',
    }
  )
}
