'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, User as UserIcon, Users } from 'lucide-react'
import { AthleteFederationStatusBadge } from '@/components/athletes/status-badges'
import { AthleteDrawer, type DrawerAthlete } from '@/components/AthleteDrawer'

export function TeamAthletesListClient({ athletes }: { athletes: DrawerAthlete[] }) {
  const [open, setOpen] = useState<DrawerAthlete | null>(null)

  const grouped = useMemo(() => {
    const map: Record<string, DrawerAthlete[]> = {}
    for (const a of athletes) {
      const key = a.category || 'Sem categoria'
      map[key] = map[key] || []
      map[key].push(a)
    }
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'Sem categoria') return 1
      if (b === 'Sem categoria') return -1
      return a.localeCompare(b)
    })
  }, [athletes])

  if (athletes.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-[var(--border)] bg-white p-14 text-center">
        <Users className="mx-auto h-10 w-10 text-[var(--gray)] opacity-40" />
        <p className="mt-4 text-sm font-medium text-[var(--gray)]">Nenhum atleta federado vinculado a esta equipe ainda.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {grouped.map(([category, list]) => (
          <div key={category} className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Categoria</p>
                <h2 className="fgb-display mt-1 text-xl leading-none text-[var(--black)]">{category}</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
                {list.length} atleta(s)
              </span>
            </div>
            <div className="space-y-3">
              {list.map((athlete) => (
                <button
                  key={athlete.id}
                  type="button"
                  onClick={() => setOpen(athlete)}
                  className="w-full flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3 hover:border-[var(--verde)] hover:bg-white transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-white overflow-hidden flex items-center justify-center shrink-0">
                      {athlete.photoUrl ? (
                        <img src={athlete.photoUrl} alt={athlete.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-[var(--gray)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase text-[var(--black)] truncate">{athlete.name}</p>
                      <p className="text-[10px] text-[var(--gray)] truncate">
                        {athlete.document || athlete.cpf || 'Sem documento'}
                        {athlete.jerseyNumber != null ? ` · #${athlete.jerseyNumber}` : ''}
                        {athlete.position ? ` · ${athlete.position}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AthleteFederationStatusBadge status={athlete.status} />
                    <ChevronRight className="w-4 h-4 text-[var(--gray)]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AthleteDrawer athlete={open} onClose={() => setOpen(null)} />
    </>
  )
}
