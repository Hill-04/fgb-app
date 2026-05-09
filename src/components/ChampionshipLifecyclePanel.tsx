'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Transition = {
  status: string
  label: string
}

type HistoryEntry = {
  id: string
  from: string
  fromLabel: string
  to: string
  toLabel: string
  reason: string | null
  performedBy: string | null
  createdAt: string
}

type LifecycleData = {
  currentStatus: string
  currentLabel: string
  allowedTransitions: Transition[]
  history: HistoryEntry[]
}

export function ChampionshipLifecyclePanel({ championshipId }: { championshipId: string }) {
  const router = useRouter()
  const [data, setData] = useState<LifecycleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [showReasonFor, setShowReasonFor] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/championships/${championshipId}/transition`, { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [championshipId])

  async function performTransition(toStatus: string, providedReason?: string) {
    setSubmitting(toStatus)
    try {
      const res = await fetch(`/api/championships/${championshipId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, reason: providedReason ?? reason ?? null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Erro ao transicionar')
        return
      }
      setReason('')
      setShowReasonFor(null)
      await load()
      router.refresh()
    } finally {
      setSubmitting(null)
    }
  }

  if (loading || !data) {
    return <div className="fgb-card p-4 text-sm text-[var(--gray)]">Carregando ciclo de vida...</div>
  }

  return (
    <div className="fgb-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Status atual</p>
          <h3 className="fgb-display text-[20px] text-[var(--verde)]">{data.currentLabel}</h3>
        </div>
        <span className="fgb-badge fgb-badge-verde">{data.currentStatus}</span>
      </div>

      {data.allowedTransitions.length > 0 ? (
        <div>
          <p className="fgb-label text-[var(--gray)] mb-2" style={{ fontSize: 10 }}>Transições disponíveis</p>
          <div className="flex flex-wrap gap-2">
            {data.allowedTransitions.map((t) => (
              <button
                key={t.status}
                onClick={() => setShowReasonFor(t.status)}
                disabled={submitting === t.status}
                className="fgb-btn-outline text-xs px-3 py-2"
              >
                → {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-[var(--gray)]">Nenhuma transição disponível.</p>
      )}

      {showReasonFor && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowReasonFor(null)}
        >
          <div className="fgb-card p-5 max-w-lg w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="fgb-display text-[16px]">
              Transicionar para {data.allowedTransitions.find((t) => t.status === showReasonFor)?.label}
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="fgb-input w-full"
              rows={3}
              placeholder="Motivo (opcional, mas recomendado para auditoria)"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReasonFor(null)}
                disabled={submitting === showReasonFor}
                className="px-3 py-2 text-sm border border-[var(--border)] rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => performTransition(showReasonFor)}
                disabled={submitting === showReasonFor}
                className="fgb-btn-primary text-sm"
              >
                {submitting === showReasonFor ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {data.history.length > 0 && (
        <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="fgb-label text-[var(--gray)] mb-2" style={{ fontSize: 10 }}>
            Histórico ({data.history.length})
          </p>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {data.history.map((h) => (
              <li key={h.id} className="text-xs flex items-start gap-2">
                <span className="text-[var(--gray)] w-24 shrink-0">
                  {new Date(h.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex-1">
                  <strong>{h.fromLabel}</strong> → <strong>{h.toLabel}</strong>
                  {h.reason && <span className="text-[var(--gray)]"> · {h.reason}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
