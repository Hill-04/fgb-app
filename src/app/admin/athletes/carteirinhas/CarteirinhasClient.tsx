'use client'
import { useState } from 'react'
import { Printer } from 'lucide-react'
import CarteirinhaCard from '@/components/CarteirinhaCard'

type Athlete = {
  id: string; name: string; registrationNumber: number | null
  situation: string; photoUrl: string | null; position: string | null
  team: { id: string; name: string } | null
  cards: Array<{ cardNumber: string; qrToken: string; status: string }>
}
type Team = { id: string; name: string }

export default function CarteirinhasClient({ athletes, teams }: { athletes: Athlete[]; teams: Team[] }) {
  const [filterTeam, setFilterTeam] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [printing, setPrinting] = useState(false)

  const filtered = athletes.filter(a => !filterTeam || a.team?.id === filterTeam)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map(a => a.id)))
  }

  function print() {
    setPrinting(true)
    setTimeout(() => { window.print(); setPrinting(false) }, 300)
  }

  const selectedAthletes = filtered.filter(a => selected.has(a.id))
  const inputCls = 'h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm focus:outline-none focus:border-[var(--verde)]'

  return (
    <div className="space-y-6 pb-12">
      <div className="no-print flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Atletas</p>
          <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Impressão de Carteirinhas</h1>
          <p className="mt-1 text-sm text-[var(--gray)]">{selected.size} selecionados</p>
        </div>
        <div className="flex gap-3">
          <button onClick={selectAll} className={`${inputCls} px-4 text-[10px] font-black uppercase tracking-widest`}>
            Selecionar todos ({filtered.length})
          </button>
          <button onClick={print} disabled={selected.size === 0 || printing}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--verde)] px-5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">
            <Printer className="h-4 w-4" /> Imprimir {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>

      <div className="no-print flex gap-3">
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className={`${inputCls} w-56`}>
          <option value="">Todos os clubes</option>
          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Área de impressão */}
      <div className="print-area grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(printing ? selectedAthletes : filtered).map(a => (
          <div key={a.id} className={`relative cursor-pointer transition-all no-print-outline ${
            !printing && selected.has(a.id) ? 'ring-2 ring-[var(--verde)] ring-offset-2 rounded-[14px]' : ''
          }`}
            onClick={() => !printing && toggleSelect(a.id)}>
            {!printing && (
              <div className="absolute top-2 right-2 z-10">
                <input type="checkbox" readOnly checked={selected.has(a.id)}
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--verde)]" />
              </div>
            )}
            <CarteirinhaCard
              type="athlete"
              name={a.name}
              registrationNumber={a.registrationNumber}
              photoUrl={a.photoUrl}
              teamName={a.team?.name}
              situation={a.situation}
              verified={(a as any).verifiedFgb ?? false}
              season={2026}
              athleteId={a.id}
            />
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-3 py-10 text-center text-sm text-[var(--gray)]">Nenhum atleta encontrado.</p>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-area { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; padding: 10mm; }
        }
      `}</style>
    </div>
  )
}
