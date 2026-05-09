'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Declaration = {
  id: string
  athleteName: string
  competitionId: string
  competitionName: string
  organizer: string
  status: string
  createdAt: string
  blockedChampionships: string[]
}

export function DeclarationsClient({ declarations }: { declarations: Declaration[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function handleWithdraw(id: string) {
    if (!confirm('Retirar esta declaração liberará a atleta para as competições da FGB. Confirmar?')) return
    setPending(id)
    try {
      const res = await fetch(`/api/external-registrations/${id}/withdraw`, { method: 'PATCH' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao retirar')
      }
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPending(null)
    }
  }

  if (declarations.length === 0) {
    return (
      <div className="fgb-card p-10 text-center text-[var(--gray)]">
        Nenhuma declaração registrada.
      </div>
    )
  }

  return (
    <div className="fgb-card overflow-hidden">
      <table className="w-full text-sm">
        <thead style={{ background: 'var(--bg-soft)' }}>
          <tr>
            <th className="text-left p-3 fgb-label">Atleta</th>
            <th className="text-left p-3 fgb-label">Competição</th>
            <th className="text-left p-3 fgb-label">Bloqueia</th>
            <th className="text-center p-3 fgb-label">Status</th>
            <th className="text-right p-3 fgb-label">Ações</th>
          </tr>
        </thead>
        <tbody>
          {declarations.map((d) => (
            <tr key={d.id} style={{ borderTop: '1px solid var(--border)' }}>
              <td className="p-3 font-semibold">{d.athleteName}</td>
              <td className="p-3">
                <p className="text-sm">{d.competitionName}</p>
                <p className="text-xs text-[var(--gray)]">{d.organizer}</p>
              </td>
              <td className="p-3 text-xs">
                {d.blockedChampionships.length === 0 ? (
                  <span className="text-[var(--gray)]">—</span>
                ) : (
                  <ul className="space-y-0.5" style={{ color: 'var(--red)' }}>
                    {d.blockedChampionships.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="p-3 text-center">
                <span className={`fgb-badge ${d.status === 'WITHDRAWN' ? 'fgb-badge-outline' : 'fgb-badge-verde'}`}>
                  {d.status}
                </span>
              </td>
              <td className="p-3 text-right">
                {d.status !== 'WITHDRAWN' && (
                  <button
                    onClick={() => handleWithdraw(d.id)}
                    disabled={pending === d.id}
                    className="text-xs text-[var(--red)] uppercase tracking-wide font-semibold"
                  >
                    {pending === d.id ? '...' : 'Retirar'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
