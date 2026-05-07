'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Search, User as UserIcon, X } from 'lucide-react'
import { toggleFederationStatus, issueCard } from './actions'

type Athlete = {
  id: string
  name: string
  status: string
  federationStatus: string
  jerseyNumber: number | null
  position: string | null
  photoUrl: string | null
  document: string | null
  team: { name: string } | null
  cards: { cardNumber: string; qrToken: string }[]
  registrationRequests: { requestedCategoryLabel: string | null }[]
}

export function AthleteListClient({ athletes }: { athletes: Athlete[] }) {
  const [query, setQuery] = useState('')

  const q = query.toLowerCase().trim()
  const filtered = q
    ? athletes.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.team?.name.toLowerCase().includes(q) ||
        a.document?.toLowerCase().includes(q) ||
        a.jerseyNumber?.toString().includes(q) ||
        a.position?.toLowerCase().includes(q)
      )
    : athletes

  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white shadow-sm overflow-hidden">
      {/* Search bar */}
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--gray-l)]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray)]" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nome, equipe, CPF, nº camisa..."
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:border-[var(--verde)]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray)] hover:text-[var(--black)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <span className="text-[10px] font-black uppercase text-[var(--gray)] shrink-0">
            {filtered.length} de {athletes.length}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-[var(--border)]">
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-[var(--gray)]">
              {q ? `Nenhum atleta encontrado para "${query}"` : 'Nenhum atleta cadastrado.'}
            </p>
          </div>
        ) : (
          filtered.map(athlete => {
            const isFedActive = athlete.federationStatus === 'ACTIVE'
            return (
              <div key={athlete.id} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-[var(--gray-l)] transition-colors">
                {/* Avatar + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--gray-l)] overflow-hidden">
                    {athlete.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={athlete.photoUrl} alt={athlete.name} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-[var(--gray)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black uppercase text-[var(--black)] truncate">{athlete.name}</p>
                      {athlete.jerseyNumber != null && (
                        <span className="text-[10px] font-black text-[var(--verde)]">#{athlete.jerseyNumber}</span>
                      )}
                      {athlete.position && (
                        <span className="text-[10px] font-bold text-[var(--gray)] uppercase">{athlete.position}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--gray)] truncate mt-0.5">
                      {athlete.team?.name || 'Sem equipe'}
                      {athlete.document && ` · ${athlete.document}`}
                      {athlete.registrationRequests[0]?.requestedCategoryLabel && ` · ${athlete.registrationRequests[0].requestedCategoryLabel}`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                    style={isFedActive
                      ? { background: 'rgba(27,115,64,0.12)', color: 'var(--verde)', border: '1px solid rgba(27,115,64,0.25)' }
                      : { background: 'rgba(180,0,0,0.08)', color: '#b44', border: '1px solid rgba(180,0,0,0.2)' }
                    }>
                    {isFedActive ? 'FGB' : 'Liberado'}
                  </span>

                  {athlete.cards[0] ? (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[var(--verde)]/20 bg-[var(--verde)]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[var(--verde)]">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Carteira
                    </span>
                  ) : (
                    <form action={issueCard}>
                      <input type="hidden" name="athleteId" value={athlete.id} />
                      <button type="submit" className="hidden sm:inline-flex h-7 items-center rounded-xl border border-[var(--border)] bg-white px-2.5 text-[9px] font-black uppercase text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors">
                        Gerar carteira
                      </button>
                    </form>
                  )}

                  <form action={toggleFederationStatus}>
                    <input type="hidden" name="id" value={athlete.id} />
                    <input type="hidden" name="current" value={athlete.federationStatus} />
                    <button type="submit"
                      className="h-7 px-2.5 rounded-xl text-[9px] font-black uppercase transition-colors border"
                      style={isFedActive
                        ? { borderColor: 'rgba(180,0,0,0.3)', color: '#b44', background: 'rgba(180,0,0,0.06)' }
                        : { borderColor: 'rgba(27,115,64,0.35)', color: 'var(--verde)', background: 'rgba(27,115,64,0.08)' }
                      }>
                      {isFedActive ? 'Liberar' : 'Reativar'}
                    </button>
                  </form>

                  <Link href={`/admin/athletes/${athlete.id}`}
                    className="inline-flex h-7 items-center rounded-xl border border-[var(--border)] bg-white px-2.5 text-[9px] font-black uppercase text-[var(--gray)] hover:border-[var(--verde)] hover:text-[var(--verde)] transition-colors">
                    Perfil
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
