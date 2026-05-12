'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

type External = {
  id: string
  name: string
  organizer: string
  city: string | null
  state: string | null
  startDate: string
  endDate: string
  websiteUrl: string | null
  categories: string[]
  blocks: Array<{ championshipId: string; championshipName: string }>
  declaredCount: number
}

type Athlete = {
  id: string
  name: string
  sex: string | null
  birthDate: string | null
}

export function TeamCompetitionsClient({
  externals,
  athletes,
  teamId,
}: {
  externals: External[]
  athletes: Athlete[]
  teamId: string
}) {
  const router = useRouter()
  const [openModalId, setOpenModalId] = useState<string | null>(null)
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  const activeExternal = useMemo(
    () => externals.find((e) => e.id === openModalId) ?? null,
    [externals, openModalId],
  )

  function toggleAthlete(id: string) {
    setSelectedAthletes((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    )
  }

  function openModal(id: string) {
    setOpenModalId(id)
    setSelectedAthletes([])
  }

  async function handleConfirm() {
    if (!activeExternal || selectedAthletes.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/external-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalCompetitionId: activeExternal.id,
          athleteIds: selectedAthletes,
          teamId,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao declarar')
      }
      setOpenModalId(null)
      setSelectedAthletes([])
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {externals.map((e) => (
          <div key={e.id} className="fgb-card p-5" style={{ borderLeft: '4px solid var(--gray)' }}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="fgb-display text-[16px] text-[var(--black)]">{e.name}</h3>
              <span className="fgb-badge fgb-badge-outline text-[10px]">EXTERNO</span>
            </div>
            <p className="text-sm text-[var(--gray)] mb-2">
              Organizador: {e.organizer}
              {e.city && ` · ${e.city}`}
              {e.state && `/${e.state}`}
            </p>
            <p className="text-xs text-[var(--gray)] mb-3">
              {fmtDate(e.startDate)} → {fmtDate(e.endDate)}
            </p>
            {e.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {e.categories.slice(0, 4).map((c) => (
                  <span key={c} className="fgb-badge fgb-badge-outline text-[10px]">{c}</span>
                ))}
              </div>
            )}
            {e.blocks.length > 0 && (
              <div
                className="text-xs p-2 rounded mb-3 flex items-start gap-1"
                style={{ background: 'rgba(204,16,22,0.08)', color: 'var(--red)' }}
              >
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>BLOQUEIA:</strong>{' '}
                  {e.blocks.map((b) => b.championshipName).join(', ')}
                </span>
              </div>
            )}
            {e.declaredCount > 0 && (
              <p className="text-xs mb-2 text-[var(--verde)] font-semibold">
                {e.declaredCount} atleta(s) declarada(s)
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <button onClick={() => openModal(e.id)} className="fgb-btn-primary text-xs flex-1">
                Declarar Participação
              </button>
              {e.websiteUrl && (
                <a
                  href={e.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 text-xs border border-[var(--border)] rounded text-center"
                >
                  Ver Detalhes
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeExternal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => !submitting && setOpenModalId(null)}
        >
          <div
            className="fgb-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div>
                <h3 className="fgb-display text-[18px]">Declarar participação em:</h3>
                <p className="text-[var(--verde)] font-semibold">{activeExternal.name}</p>
              </div>

              <div>
                <label className="fgb-label block mb-2">Selecione as atletas:</label>
                {athletes.length === 0 ? (
                  <p className="text-sm text-[var(--gray)]">
                    Nenhuma atleta cadastrada na sua equipe.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto border rounded p-2">
                    {athletes.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-[var(--bg-soft)]">
                        <input
                          type="checkbox"
                          checked={selectedAthletes.includes(a.id)}
                          onChange={() => toggleAthlete(a.id)}
                        />
                        <span className="text-sm flex-1">{a.name}</span>
                        {a.sex && <span className="text-xs text-[var(--gray)]">{a.sex}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {selectedAthletes.length > 0 && activeExternal.blocks.length > 0 && (
                <div
                  className="rounded p-3 text-sm"
                  style={{ background: 'rgba(204,16,22,0.08)', borderLeft: '4px solid var(--red)' }}
                >
                  <div className="flex items-center gap-1 mb-2 text-[var(--red)] font-semibold">
                    <AlertTriangle size={14} /> Consequências:
                  </div>
                  <p className="mb-2">
                    As {selectedAthletes.length} atleta(s) selecionada(s) ficarão{' '}
                    <strong>BLOQUEADAS</strong> para:
                  </p>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {activeExternal.blocks.map((b) => (
                      <li key={b.championshipId}>{b.championshipName}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setOpenModalId(null)}
                  disabled={submitting}
                  className="px-4 py-2 text-sm border border-[var(--border)] rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting || selectedAthletes.length === 0}
                  className="fgb-btn-primary"
                >
                  {submitting ? 'Salvando...' : 'Confirmar Declaração'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
