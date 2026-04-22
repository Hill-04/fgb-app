import { Ban, CheckCircle2, Clock, FileText, Receipt, Wallet } from 'lucide-react'

type TimelineLog = {
  id: string
  action: string
  description: string
  createdAt: Date | string
  createdBy?: { name?: string | null; email?: string | null } | null
}

type InvoiceTimelineProps = {
  logs: TimelineLog[]
}

function getTimelineIcon(action: string) {
  const normalized = action.toUpperCase()
  if (normalized.includes('PAYMENT')) return Wallet
  if (normalized.includes('ISSUED')) return Receipt
  if (normalized.includes('VOID')) return Ban
  if (normalized.includes('PDF')) return FileText
  if (normalized.includes('CREATE')) return CheckCircle2
  return Clock
}

function getTimelineLabel(action: string) {
  const normalized = action.toUpperCase()
  if (normalized.includes('PAYMENT')) return 'Baixa financeira'
  if (normalized.includes('ISSUED')) return 'Emissao oficial'
  if (normalized.includes('VOID')) return 'Cancelamento'
  if (normalized.includes('PDF')) return 'Documento PDF'
  if (normalized.includes('CREATE')) return 'Criacao da fatura'
  if (normalized.includes('UPDATED')) return 'Atualizacao administrativa'
  return action
}

export function InvoiceTimeline({ logs }: InvoiceTimelineProps) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Historico financeiro oficial</p>
        <h2 className="fgb-display mt-2 text-2xl leading-none text-[var(--black)]">Timeline da fatura</h2>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--gray-l)] p-5 text-sm font-semibold text-[var(--gray)]">
          Nenhuma movimentacao registrada.
        </div>
      ) : (
        <div className="relative space-y-4">
          <div className="absolute bottom-4 left-5 top-4 w-px bg-[var(--border)]" />
          {logs.map((log) => {
            const Icon = getTimelineIcon(log.action)
            return (
              <div key={log.id} className="relative flex gap-4">
                <div className="z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--verde)] shadow-sm">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-[var(--black)]">{getTimelineLabel(log.action)}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-[var(--gray)]">{log.description}</p>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {log.createdBy?.name || log.createdBy?.email ? (
                    <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                      Responsavel: {log.createdBy?.name || log.createdBy?.email}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
