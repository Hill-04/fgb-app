'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertTriangle, CheckCircle, Trophy } from 'lucide-react'

type Block = {
  id: string
  championshipName: string
  reason: string
  externalCompetitionName: string
}

type Declaration = {
  id: string
  name: string
  organizer: string
  startDate: string
  endDate: string
  season: number
  status: string
}

export function AthleteCompetitionsTab({
  activeBlocks,
  externalDeclarations,
}: {
  activeBlocks: Block[]
  externalDeclarations: Declaration[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function handleLift(id: string) {
    const reason = prompt('Justifique o levantamento do bloqueio:')
    if (!reason?.trim()) return
    setPending(id)
    try {
      const res = await fetch(`/api/fgb-registration-blocks/${id}/lift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao levantar')
      }
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPending(null)
    }
  }

  const hasBlocks = activeBlocks.length > 0
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return (
    <div className="space-y-4">
      <div className="fgb-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)] flex items-center gap-2">
          <Trophy size={14} className="text-[var(--verde)]" />
          <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>Competições — Temporada 2026</p>
        </div>

        <div className="p-5 space-y-3">
          <div
            className="rounded p-3 flex items-start gap-2"
            style={{
              background: hasBlocks ? 'rgba(204,16,22,0.08)' : 'rgba(20,85,48,0.08)',
              borderLeft: `4px solid ${hasBlocks ? 'var(--red)' : 'var(--verde)'}`,
            }}
          >
            {hasBlocks ? (
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
            ) : (
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--verde)' }} />
            )}
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: hasBlocks ? 'var(--red)' : 'var(--verde)' }}>
                STATUS: {hasBlocks ? '⛔ BLOQUEADA' : '✅ ELEGÍVEL para competições FGB'}
              </p>
              {hasBlocks && (
                <div className="text-xs text-[var(--black)] mt-2 space-y-2">
                  {activeBlocks.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded">
                      <div>
                        <p className="font-semibold">Campeonato bloqueado: {b.championshipName}</p>
                        <p className="text-[var(--gray)]">Motivo: {b.reason}</p>
                      </div>
                      <button
                        onClick={() => handleLift(b.id)}
                        disabled={pending === b.id}
                        className="text-xs text-[var(--verde)] uppercase tracking-wide font-semibold flex-shrink-0"
                      >
                        {pending === b.id ? '...' : 'Levantar'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {externalDeclarations.length > 0 && (
        <div className="fgb-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
            <p className="fgb-label text-[var(--gray)]" style={{ fontSize: 10 }}>
              Competições externas declaradas
            </p>
          </div>
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--bg-soft)' }}>
              <tr>
                <th className="text-left p-3 fgb-label">Competição</th>
                <th className="text-left p-3 fgb-label">Organizador</th>
                <th className="text-left p-3 fgb-label">Período</th>
                <th className="text-center p-3 fgb-label">Temporada</th>
                <th className="text-center p-3 fgb-label">Status</th>
              </tr>
            </thead>
            <tbody>
              {externalDeclarations.map((d) => (
                <tr key={d.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="p-3 font-semibold">{d.name}</td>
                  <td className="p-3 text-[var(--gray)]">{d.organizer}</td>
                  <td className="p-3 text-xs">{fmtDate(d.startDate)} → {fmtDate(d.endDate)}</td>
                  <td className="p-3 text-center">{d.season}</td>
                  <td className="p-3 text-center">
                    <span className={`fgb-badge ${d.status === 'WITHDRAWN' ? 'fgb-badge-outline' : 'fgb-badge-verde'}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
