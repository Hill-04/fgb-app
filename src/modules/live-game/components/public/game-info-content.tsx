'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGameData } from './game-data-provider'

type Official = {
  id: string
  name: string
  officialType: string
  typeLabel: string
  role: string
}

type RefereeAssignment = {
  id: string
  name: string
  licenseNumber: string | null
  role: string
}

type GameInfoPayload = {
  game: {
    id: string
    dateTime: string
    location: string
    city: string
    court: string | null
    venue: string | null
    attendance: number | null
    championship: string | null
    category: string | null
  }
  officials: Official[]
  referees: RefereeAssignment[]
}

const OFFICIAL_ORDER = ['COMMISSIONER', 'DELEGATE', 'REFEREE', 'TABLE', 'STATS', 'OTHER']

function roleLabel(role: string) {
  const map: Record<string, string> = {
    MAIN: 'Principal',
    ASSISTANT: 'Auxiliar',
    HEAD_COACH: 'Técnico Principal',
  }
  return map[role] ?? role
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-4 border-t border-[var(--border)] py-3 first:border-t-0">
      <span className="w-36 shrink-0 text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
        {label}
      </span>
      <span className="text-sm text-[var(--black)]">{value}</span>
    </div>
  )
}

function OfficialCard({ official }: { official: Official | RefereeAssignment & { typeLabel?: string; officialType?: string } }) {
  const typeLabel = 'typeLabel' in official ? official.typeLabel : 'Árbitro'
  const role = 'role' in official ? official.role : ''
  const licenseNumber = 'licenseNumber' in official ? official.licenseNumber : null

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-white px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--verde)]/10">
        <span className="text-[10px] font-black text-[var(--verde)]">
          {(official.name || '?')[0].toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--black)]">{official.name}</p>
        <p className="text-[10px] text-[var(--gray)]">
          {typeLabel}
          {role && role !== official.name ? ` · ${roleLabel(role)}` : ''}
          {licenseNumber ? ` · Lic. ${licenseNumber}` : ''}
        </p>
      </div>
    </div>
  )
}

export function GameInfoContent() {
  const { gameId } = useGameData()

  const [info, setInfo] = useState<GameInfoPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const fetchInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/games/${gameId}/game-info`, { cache: 'no-store' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error || 'Erro ao carregar informações')
      if (mountedRef.current) {
        setInfo(payload as GameInfoPayload)
        setError(null)
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message || 'Erro ao carregar informações')
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    mountedRef.current = true
    fetchInfo()
    return () => {
      mountedRef.current = false
    }
  }, [fetchInfo])

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 rounded-[28px] bg-[var(--gray-l)]" />
        <div className="h-40 rounded-[28px] bg-[var(--gray-l)]" />
      </div>
    )
  }

  if (error || !info) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || 'Não foi possível carregar as informações da partida.'}
      </div>
    )
  }

  const { game, officials, referees } = info

  const scheduledDate = new Date(game.dateTime).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const scheduledTime = new Date(game.dateTime).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const sortedOfficials = [...officials].sort(
    (a, b) => OFFICIAL_ORDER.indexOf(a.officialType) - OFFICIAL_ORDER.indexOf(b.officialType)
  )

  const hasOfficials = officials.length > 0 || referees.length > 0

  return (
    <div className="space-y-6">
      {/* Match details */}
      <div className="fgb-card p-6">
        <h2 className="fgb-display text-2xl text-[var(--black)]">Informações da Partida</h2>
        <div className="mt-4">
          <InfoRow label="Campeonato" value={game.championship} />
          <InfoRow label="Categoria" value={game.category} />
          <InfoRow label="Data" value={`${scheduledDate} às ${scheduledTime}`} />
          {(game.venue || game.location) && (
            <InfoRow label="Ginásio" value={game.venue || game.location} />
          )}
          {game.city && <InfoRow label="Cidade" value={game.city} />}
          {game.court && <InfoRow label="Quadra" value={game.court} />}
          {game.attendance !== null && game.attendance !== undefined && (
            <InfoRow
              label="Público"
              value={`${game.attendance.toLocaleString('pt-BR')} pessoas`}
            />
          )}
        </div>
      </div>

      {/* Officials */}
      {hasOfficials && (
        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Equipe Oficial</h2>
          <div className="mt-4 space-y-2">
            {sortedOfficials.map((o) => (
              <OfficialCard key={o.id} official={o} />
            ))}
            {referees.map((r) => (
              <OfficialCard
                key={r.id}
                official={{ ...r, typeLabel: 'Árbitro Cadastrado', officialType: 'REFEREE' }}
              />
            ))}
          </div>
        </div>
      )}

      {!hasOfficials && (
        <div className="fgb-card p-6">
          <h2 className="fgb-display text-2xl text-[var(--black)]">Equipe Oficial</h2>
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--gray)]">
            Oficiais não informados.
          </div>
        </div>
      )}
    </div>
  )
}
