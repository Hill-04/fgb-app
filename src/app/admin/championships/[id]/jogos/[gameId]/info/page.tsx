'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react'

type GameOfficial = {
  id: string
  officialType: string
  name: string
  role: string
}

type GameInfo = {
  id: string
  dateTime: string
  location: string
  city: string
  court: string | null
  venue: string | null
  attendance: number | null
  championship: { name: string; year: number } | null
  category: { name: string } | null
  officials: GameOfficial[]
  refereeAssignments: {
    id: string
    role: string
    referee: { id: string; name: string; licenseNumber: string | null }
  }[]
}

const OFFICIAL_TYPES = [
  { value: 'COMMISSIONER', label: 'Comissário' },
  { value: 'DELEGATE', label: 'Delegado' },
  { value: 'REFEREE', label: 'Árbitro' },
  { value: 'TABLE', label: 'Mesário' },
  { value: 'STATS', label: 'Estatístico' },
  { value: 'OTHER', label: 'Outro' },
]

const OFFICIAL_ROLES = [
  { value: 'MAIN', label: 'Principal' },
  { value: 'ASSISTANT', label: 'Auxiliar' },
  { value: 'HEAD_COACH', label: 'Técnico Principal' },
  { value: 'MEMBER', label: 'Membro' },
]

function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--black)] outline-none focus:border-[var(--verde)] focus:ring-1 focus:ring-[var(--verde)]"
      />
    </div>
  )
}

export default function AdminGameInfoPage() {
  const params = useParams<{ id: string; gameId: string }>()
  const router = useRouter()
  const { id: championshipId, gameId } = params

  const [info, setInfo] = useState<GameInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const [venue, setVenue] = useState('')
  const [location, setLocation] = useState('')
  const [city, setCity] = useState('')
  const [court, setCourt] = useState('')
  const [attendance, setAttendance] = useState('')

  const [newOfficialType, setNewOfficialType] = useState('REFEREE')
  const [newOfficialName, setNewOfficialName] = useState('')
  const [newOfficialRole, setNewOfficialRole] = useState('MAIN')
  const [isAddingOfficial, setIsAddingOfficial] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/games/${gameId}/info`)
      if (!res.ok) throw new Error('Erro ao carregar')
      const data: GameInfo = await res.json()
      setInfo(data)
      setVenue(data.venue ?? '')
      setLocation(data.location ?? '')
      setCity(data.city ?? '')
      setCourt(data.court ?? '')
      setAttendance(data.attendance != null ? String(data.attendance) : '')
    } catch {
      // silently fail — user sees empty form
    } finally {
      setIsLoading(false)
    }
  }, [gameId])

  useEffect(() => { load() }, [load])

  async function save() {
    setIsSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/admin/games/${gameId}/info`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue, location, city, court, attendance }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao salvar')
      }
      setSaveMsg('Informações salvas com sucesso.')
    } catch (e: any) {
      setSaveMsg(`Erro: ${e.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  async function addOfficial() {
    if (!newOfficialName.trim()) return
    setIsAddingOfficial(true)
    try {
      const res = await fetch(`/api/admin/games/${gameId}/info/officials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officialType: newOfficialType,
          name: newOfficialName.trim(),
          role: newOfficialRole,
        }),
      })
      if (!res.ok) throw new Error('Erro ao adicionar oficial')
      setNewOfficialName('')
      await load()
    } catch {
      // no-op
    } finally {
      setIsAddingOfficial(false)
    }
  }

  async function removeOfficial(officialId: string) {
    try {
      await fetch(`/api/admin/games/${gameId}/info/officials/${officialId}`, { method: 'DELETE' })
      await load()
    } catch {
      // no-op
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[900px] space-y-6 pb-10 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-[var(--gray-l)]" />
        <div className="h-64 rounded-[28px] bg-[var(--gray-l)]" />
        <div className="h-64 rounded-[28px] bg-[var(--gray-l)]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-6 pb-10">
      <Link
        href={`/admin/championships/${championshipId}/jogos/${gameId}`}
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--gray)] hover:text-[var(--black)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para o Jogo
      </Link>

      {info && (
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="fgb-label text-[var(--gray)]">
            {info.championship?.name} {info.championship?.year} · {info.category?.name}
          </p>
          <h1 className="mt-1 fgb-display text-3xl text-[var(--black)]">Informações da Partida</h1>
        </div>
      )}

      {/* Venue & details form */}
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="fgb-display text-xl text-[var(--black)]">Local e Público</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <LabeledInput label="Ginásio" value={venue} onChange={setVenue} placeholder="Nome do ginásio" />
          <LabeledInput label="Endereço / Local" value={location} onChange={setLocation} placeholder="Endereço" />
          <LabeledInput label="Cidade" value={city} onChange={setCity} placeholder="Cidade" />
          <LabeledInput label="Quadra" value={court} onChange={setCourt} placeholder="Quadra (opcional)" />
          <LabeledInput label="Público" value={attendance} onChange={setAttendance} type="number" placeholder="Número de pessoas" />
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={save}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--verde)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          {saveMsg && (
            <span className={`text-sm ${saveMsg.startsWith('Erro') ? 'text-red-600' : 'text-[var(--verde)]'}`}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* Officials manager */}
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <h2 className="fgb-display text-xl text-[var(--black)]">Equipe Oficial</h2>

        <div className="mt-4 space-y-2">
          {(info?.officials ?? []).length === 0 && (
            <p className="text-sm text-[var(--gray)]">Nenhum oficial cadastrado.</p>
          )}
          {(info?.officials ?? []).map((o) => {
            const typeLabel = OFFICIAL_TYPES.find((t) => t.value === o.officialType)?.label ?? o.officialType
            const roleLabel = OFFICIAL_ROLES.find((r) => r.value === o.role)?.label ?? o.role
            return (
              <div
                key={o.id}
                className="flex items-center gap-4 rounded-xl border border-[var(--border)] px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--verde)]/10">
                  <span className="text-[10px] font-black text-[var(--verde)]">
                    {(o.name || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--black)] truncate">{o.name}</p>
                  <p className="text-[10px] text-[var(--gray)]">{typeLabel} · {roleLabel}</p>
                </div>
                <button
                  onClick={() => removeOfficial(o.id)}
                  className="shrink-0 rounded-lg p-1.5 text-[var(--gray)] hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Referee assignments (read-only, managed via arbitragem) */}
        {(info?.refereeAssignments ?? []).length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)]">
              Árbitros Cadastrados
            </p>
            {info!.refereeAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 rounded-xl border border-dashed border-[var(--border)] px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gray-l)]">
                  <span className="text-[10px] font-black text-[var(--gray)]">
                    {(a.referee.name || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--black)] truncate">{a.referee.name}</p>
                  <p className="text-[10px] text-[var(--gray)]">
                    Árbitro Cadastrado
                    {a.referee.licenseNumber ? ` · Lic. ${a.referee.licenseNumber}` : ''}
                  </p>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-[var(--gray)]">
              Árbitros cadastrados são gerenciados via{' '}
              <Link
                href={`/admin/championships/${championshipId}/arbitragem`}
                className="underline hover:text-[var(--black)]"
              >
                Arbitragem
              </Link>
              .
            </p>
          </div>
        )}

        {/* Add official form */}
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-3">
            Adicionar Oficial
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-1">
                Tipo
              </label>
              <select
                value={newOfficialType}
                onChange={(e) => setNewOfficialType(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--black)] outline-none focus:border-[var(--verde)]"
              >
                {OFFICIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-1">
                Nome
              </label>
              <input
                type="text"
                value={newOfficialName}
                onChange={(e) => setNewOfficialName(e.target.value)}
                placeholder="Nome completo"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--black)] outline-none focus:border-[var(--verde)] focus:ring-1 focus:ring-[var(--verde)]"
                onKeyDown={(e) => e.key === 'Enter' && addOfficial()}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--gray)] mb-1">
                Função
              </label>
              <select
                value={newOfficialRole}
                onChange={(e) => setNewOfficialRole(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--black)] outline-none focus:border-[var(--verde)]"
              >
                {OFFICIAL_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={addOfficial}
            disabled={isAddingOfficial || !newOfficialName.trim()}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--verde)] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--verde)] disabled:opacity-50 hover:bg-[var(--verde)]/5"
          >
            {isAddingOfficial ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}
