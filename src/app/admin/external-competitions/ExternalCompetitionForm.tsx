'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Save, Trash2 } from 'lucide-react'

const ALL_CATEGORIES = [
  'Sub-12 Masculino', 'Sub-12 Feminino',
  'Sub-13 Masculino', 'Sub-13 Feminino',
  'Sub-14 Masculino', 'Sub-14 Feminino',
  'Sub-15 Masculino', 'Sub-15 Feminino',
  'Sub-17 Masculino', 'Sub-17 Feminino',
  'Sub-19 Masculino', 'Sub-19 Feminino',
  'Adulto Masculino', 'Adulto Feminino',
]

type Championship = {
  id: string
  name: string
  year: number
  categories: { id: string; name: string }[]
}

type BlockEntry = { championshipId: string; categoryId: string | null }

type Initial = {
  id: string
  name: string
  organizer: string
  city: string | null
  state: string | null
  startDate: string
  endDate: string
  categories: string[]
  gender: string | null
  description: string | null
  websiteUrl: string | null
  logoUrl: string | null
  isPublished: boolean
  season: number
  blocks: BlockEntry[]
}

export function ExternalCompetitionForm({
  championships,
  initial,
}: {
  championships: Championship[]
  initial?: Initial
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    organizer: initial?.organizer ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? 'SC',
    startDate: initial?.startDate ?? '',
    endDate: initial?.endDate ?? '',
    categories: initial?.categories ?? [],
    gender: initial?.gender ?? '',
    description: initial?.description ?? '',
    websiteUrl: initial?.websiteUrl ?? '',
    logoUrl: initial?.logoUrl ?? '',
    isPublished: initial?.isPublished ?? false,
    season: initial?.season ?? 2026,
    blocks: initial?.blocks ?? [],
  })

  const toggleCategory = (cat: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }))
  }

  const toggleBlock = (championshipId: string) => {
    setForm((f) => {
      const exists = f.blocks.some((b) => b.championshipId === championshipId && b.categoryId === null)
      if (exists) {
        return { ...f, blocks: f.blocks.filter((b) => b.championshipId !== championshipId) }
      }
      return {
        ...f,
        blocks: [
          ...f.blocks.filter((b) => b.championshipId !== championshipId),
          { championshipId, categoryId: null },
        ],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const url = initial?.id
        ? `/api/external-competitions/${initial.id}`
        : '/api/external-competitions'
      const method = initial?.id ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao salvar')
      }

      const data = await res.json()
      if (!initial?.id) {
        router.push(`/admin/external-competitions/${data.id}`)
      } else {
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initial?.id) return
    if (!confirm('Arquivar esta competição? Ela será despublicada.')) return
    setSaving(true)
    try {
      await fetch(`/api/external-competitions/${initial.id}`, { method: 'DELETE' })
      router.push('/admin/external-competitions')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/external-competitions"
          className="flex items-center gap-2 text-[var(--gray)] hover:text-[var(--verde)]"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <h1 className="fgb-display text-[24px] text-[var(--black)]">
          {initial?.id ? 'Editar Competição Externa' : 'Nova Competição Externa'}
        </h1>
        <div className="flex items-center gap-2">
          {initial?.id && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-3 py-2 rounded text-sm flex items-center gap-1 text-[var(--red)] border border-[var(--red)]"
            >
              <Trash2 size={14} />
              Arquivar
            </button>
          )}
          <button type="submit" disabled={saving} className="fgb-btn-primary flex items-center gap-2">
            <Save size={14} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="fgb-card p-3 border-l-4" style={{ borderColor: 'var(--red)' }}>
          <p className="text-sm text-[var(--red)]">{error}</p>
        </div>
      )}

      {/* Seção 1: Dados */}
      <div className="fgb-card p-6 space-y-4">
        <h2 className="fgb-display text-[18px] text-[var(--black)]">Dados da Competição</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="fgb-label block mb-1">Nome *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="fgb-input"
              placeholder="Copa Sul das Américas 2026"
            />
          </div>
          <div>
            <label className="fgb-label block mb-1">Organizador *</label>
            <input
              required
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              className="fgb-input"
              placeholder="CSAB"
            />
          </div>
          <div>
            <label className="fgb-label block mb-1">Cidade</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="fgb-input"
            />
          </div>
          <div>
            <label className="fgb-label block mb-1">Estado</label>
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="fgb-input"
              maxLength={2}
            />
          </div>
          <div>
            <label className="fgb-label block mb-1">Data Início *</label>
            <input
              required
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="fgb-input"
            />
          </div>
          <div>
            <label className="fgb-label block mb-1">Data Fim *</label>
            <input
              required
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="fgb-input"
            />
          </div>
          <div>
            <label className="fgb-label block mb-1">Site Oficial</label>
            <input
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              className="fgb-input"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="fgb-label block mb-1">Temporada</label>
            <input
              type="number"
              value={form.season}
              onChange={(e) => setForm({ ...form, season: Number(e.target.value) })}
              className="fgb-input"
            />
          </div>
        </div>

        <div>
          <label className="fgb-label block mb-1">Descrição</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="fgb-input"
            rows={3}
          />
        </div>

        <div>
          <label className="fgb-label block mb-2">Categorias afetadas</label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`fgb-badge ${form.categories.includes(cat) ? 'fgb-badge-verde' : 'fgb-badge-outline'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          <span className="fgb-label" style={{ textTransform: 'none', letterSpacing: 0 }}>
            Publicar (visível para clubes)
          </span>
        </label>
      </div>

      {/* Seção 2: Bloqueios */}
      <div className="fgb-card p-6 space-y-4">
        <div className="flex items-start gap-2 p-3 rounded" style={{ background: 'rgba(204,16,22,0.08)', borderLeft: '4px solid var(--red)' }}>
          <AlertTriangle className="flex-shrink-0 mt-0.5" size={18} style={{ color: 'var(--red)' }} />
          <p className="text-sm text-[var(--black)]">
            Atletas inscritas nesta competição <strong>NÃO poderão participar</strong> dos
            campeonatos da FGB selecionados abaixo.
          </p>
        </div>

        <h2 className="fgb-display text-[18px] text-[var(--black)]">Campeonatos FGB Bloqueados</h2>

        {championships.length === 0 ? (
          <p className="text-sm text-[var(--gray)]">Nenhum campeonato cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {championships.map((c) => {
              const blocked = form.blocks.some((b) => b.championshipId === c.id)
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded cursor-pointer"
                  style={{ background: blocked ? 'rgba(20,85,48,0.05)' : 'transparent', border: '1px solid var(--border)' }}
                >
                  <input
                    type="checkbox"
                    checked={blocked}
                    onChange={() => toggleBlock(c.id)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-[var(--gray)]">{c.year} · {c.categories.length} categorias</p>
                  </div>
                  {blocked && (
                    <span className="fgb-badge" style={{ background: 'var(--red)', color: '#fff' }}>
                      BLOQUEADO
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}
      </div>
    </form>
  )
}
