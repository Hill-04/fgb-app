'use client'

type LiveAdminAuditModeProps = {
  data: any
}

export function LiveAdminAuditMode({ data }: LiveAdminAuditModeProps) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
      <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Auditoria</h2>
      <div className="mt-5 space-y-3">
        {(data.auditLogs || []).map((log: any) => (
          <div key={log.id} className="rounded-2xl border border-[var(--border)] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--black)]">{log.description}</p>
              <span className="text-xs text-[var(--gray)]">{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--gray)]">{log.actionType} - {log.targetEntity}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
