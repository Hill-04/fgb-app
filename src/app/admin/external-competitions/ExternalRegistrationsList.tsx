'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Reg = {
  id: string
  athleteId: string | null
  athleteName: string
  teamName: string
  status: string
  createdAt: string
}

export function ExternalRegistrationsList({ registrations }: { registrations: Reg[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  async function handleWithdraw(id: string) {
    if (!confirm('Retirar declaração? Os bloqueios FGB associados serão liberados.')) return
    setPending(id)
    try {
      await fetch(`/api/external-registrations/${id}/withdraw`, { method: 'PATCH' })
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="fgb-card p-6">
      <h2 className="fgb-display text-[18px] text-[var(--black)] mb-4">
        Atletas Declaradas ({registrations.length})
      </h2>

      {registrations.length === 0 ? (
        <p className="text-sm text-[var(--gray)]">Nenhuma atleta declarada ainda.</p>
      ) : (
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--bg-soft)' }}>
            <tr>
              <th className="text-left p-2 fgb-label">Atleta</th>
              <th className="text-left p-2 fgb-label">Clube</th>
              <th className="text-center p-2 fgb-label">Status</th>
              <th className="text-left p-2 fgb-label">Declarada em</th>
              <th className="text-right p-2 fgb-label">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td className="p-2 font-semibold">{r.athleteName}</td>
                <td className="p-2 text-[var(--gray)]">{r.teamName}</td>
                <td className="p-2 text-center">
                  <span className={`fgb-badge ${r.status === 'WITHDRAWN' ? 'fgb-badge-outline' : 'fgb-badge-verde'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-2 text-xs text-[var(--gray)]">
                  {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="p-2 text-right">
                  {r.status !== 'WITHDRAWN' && (
                    <button
                      onClick={() => handleWithdraw(r.id)}
                      disabled={pending === r.id}
                      className="text-xs text-[var(--red)] uppercase tracking-wide font-semibold"
                    >
                      {pending === r.id ? '...' : 'Retirar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
