'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type Block = {
  id: string
  athleteName: string
  teamName: string
  championshipName: string
  championshipId: string
  reason: string
  externalCompetitionName: string
  isActive: boolean
  liftedAt: string | null
  liftReason: string | null
  createdAt: string
}

export function RegistrationBlocksClient({ blocks }: { blocks: Block[] }) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'LIFTED'>('ACTIVE')
  const [liftingId, setLiftingId] = useState<string | null>(null)
  const [liftReason, setLiftReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    if (filterStatus === 'ACTIVE') return blocks.filter((b) => b.isActive)
    if (filterStatus === 'LIFTED') return blocks.filter((b) => !b.isActive)
    return blocks
  }, [blocks, filterStatus])

  async function handleLift() {
    if (!liftingId || !liftReason.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/fgb-registration-blocks/${liftingId}/lift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: liftReason.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao levantar bloqueio')
      }
      setLiftingId(null)
      setLiftReason('')
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fgb-card p-4 flex items-center gap-2 flex-wrap">
        <span className="fgb-label">Status:</span>
        {(['ACTIVE', 'LIFTED', 'ALL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`fgb-badge ${filterStatus === s ? 'fgb-badge-verde' : 'fgb-badge-outline'}`}
          >
            {s === 'ACTIVE' ? 'Ativos' : s === 'LIFTED' ? 'Levantados' : 'Todos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="fgb-card p-10 text-center text-[var(--gray)]">
          Nenhum bloqueio nesse filtro.
        </div>
      ) : (
        <div className="fgb-card overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-soft)' }}>
              <tr>
                <th className="text-left p-3 fgb-label">Atleta</th>
                <th className="text-left p-3 fgb-label">Clube</th>
                <th className="text-left p-3 fgb-label">Campeonato Bloqueado</th>
                <th className="text-left p-3 fgb-label">Motivo</th>
                <th className="text-left p-3 fgb-label">Desde</th>
                <th className="text-center p-3 fgb-label">Ativo</th>
                <th className="text-right p-3 fgb-label">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="p-3 font-semibold">{b.athleteName}</td>
                  <td className="p-3 text-[var(--gray)]">{b.teamName}</td>
                  <td className="p-3">{b.championshipName}</td>
                  <td className="p-3 text-xs">{b.externalCompetitionName}</td>
                  <td className="p-3 text-xs text-[var(--gray)]">
                    {new Date(b.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-3 text-center">
                    {b.isActive ? (
                      <span className="fgb-badge" style={{ background: 'var(--red)', color: '#fff' }}>
                        Ativo
                      </span>
                    ) : (
                      <span className="fgb-badge fgb-badge-outline">Levantado</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {b.isActive && (
                      <button
                        onClick={() => setLiftingId(b.id)}
                        className="text-xs text-[var(--verde)] uppercase tracking-wide font-semibold"
                      >
                        Levantar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {liftingId && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => !submitting && setLiftingId(null)}
        >
          <div
            className="fgb-card p-6 max-w-lg w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="fgb-display text-[18px]">Levantar Bloqueio</h3>
            <p className="text-sm text-[var(--gray)]">
              Justifique a decisão. Esta ação será registrada.
            </p>
            <textarea
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
              className="fgb-input"
              rows={4}
              placeholder="Ex: Atleta cancelou inscrição na competição externa..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setLiftingId(null)}
                disabled={submitting}
                className="px-3 py-2 text-sm border border-[var(--border)] rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleLift}
                disabled={submitting || !liftReason.trim()}
                className="fgb-btn-primary"
              >
                {submitting ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
