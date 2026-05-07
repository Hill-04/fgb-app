'use client'

import { useEffect, useMemo, useState } from 'react'
import { Coins, Loader2, Pencil, Power, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrencyBRL, FEE_CATEGORIES, FEE_CATEGORY_LABELS, FeeConfigLike, groupFeeConfigsByCategory } from '@/lib/fees'

type EditableFee = FeeConfigLike & {
  id: string
  isActive: boolean
  updatedAt: string
  appliesFrom: string
}

export default function AdminFeesPage() {
  const [fees, setFees] = useState<EditableFee[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [activeCategory, setActiveCategory] = useState<(typeof FEE_CATEGORIES)[number]>('FILIACAO')
  const [editingFee, setEditingFee] = useState<EditableFee | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editValue, setEditValue] = useState(0)
  const [editDescription, setEditDescription] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)

  const loadFees = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/fees?includeInactive=true')
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao carregar taxas.')
      }

      setFees(payload)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar taxas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFees()
  }, [])

  const groupedFees = useMemo(() => groupFeeConfigsByCategory(fees), [fees])

  const activeFees = useMemo(() => fees.filter((fee) => fee.isActive), [fees])
  const latestUpdate = useMemo(() => {
    if (fees.length === 0) return null
    return fees.reduce((latest, fee) =>
      new Date(fee.updatedAt).getTime() > new Date(latest.updatedAt).getTime() ? fee : latest
    )
  }, [fees])

  const categoryItems = groupedFees.find((group) => group.category === activeCategory)?.items ?? []

  const handleSeed = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/fees/seed', { method: 'POST' })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao inserir taxas padrao.')
      }

      await loadFees()
      toast.success(`Seed concluido: ${payload.inserted} taxa(s) nova(s).`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao inserir taxas padrao.')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (fee: EditableFee) => {
    setEditingFee(fee)
    setEditLabel(fee.label)
    setEditValue(fee.value)
    setEditDescription(fee.description || '')
    setEditIsActive(fee.isActive)
  }

  const handleSave = async () => {
    if (!editingFee) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/fees/${editingFee.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editLabel,
          value: editValue,
          description: editDescription,
          isActive: editIsActive,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao atualizar taxa.')
      }

      await loadFees()
      setEditingFee(null)
      toast.success('Taxa atualizada com sucesso.')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar taxa.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (fee: EditableFee) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/fees/${fee.key}`, {
        method: 'DELETE',
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao desativar taxa.')
      }

      await loadFees()
      toast.success('Taxa desativada.')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desativar taxa.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gray)]">Carregando regimento</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="fgb-display text-4xl leading-none text-[var(--black)]">Regimento de Taxas FGB</h1>
          <p className="mt-2 text-sm text-[var(--gray)]">
            Configure valores oficiais, ativacao e vigencia das taxas usadas nas inscricoes.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSeed}
            disabled={submitting}
            className="h-11 rounded-xl bg-[var(--black)] text-white hover:bg-black/85"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Seed padrao FGB 2018
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Total taxas ativas</p>
          <p className="mt-2 text-4xl font-black text-[var(--black)]">{activeFees.length}</p>
        </div>
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Categorias</p>
          <p className="mt-2 text-4xl font-black text-[var(--black)]">{FEE_CATEGORIES.length}</p>
        </div>
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Ultima atualizacao</p>
          <p className="mt-2 text-lg font-black text-[var(--black)]">
            {latestUpdate ? new Date(latestUpdate.updatedAt).toLocaleDateString('pt-BR') : '—'}
          </p>
          <p className="mt-1 text-xs text-[var(--gray)]">
            {latestUpdate ? new Date(latestUpdate.updatedAt).toLocaleTimeString('pt-BR') : 'Sem registros'}
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm text-yellow-800 shadow-sm">
        <p className="font-black uppercase tracking-[0.15em]">Aviso importante</p>
        <p className="mt-1">Alteracoes de valor so se aplicam a novas inscricoes realizadas apos esta data.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FEE_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeCategory === category
                ? 'border-[var(--black)] bg-[var(--black)] text-white'
                : 'border-[var(--border)] bg-white text-[var(--gray)]'
            }`}
          >
            {FEE_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[var(--gray-l)]">
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Codigo</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Descricao</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Valor atual</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Aplicacao</th>
                <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Ativo</th>
                <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {categoryItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-[var(--gray)]">
                    Nenhuma taxa cadastrada nesta categoria.
                  </td>
                </tr>
              ) : (
                categoryItems.map((fee) => (
                  <tr key={fee.key} className="border-b border-[var(--border)] transition-colors hover:bg-[var(--gray-l)]">
                    <td className="px-6 py-4">
                      <div className="inline-flex rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--black)]">
                        {fee.key}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[var(--black)]">{fee.label}</p>
                      <p className="mt-1 max-w-xl text-xs text-[var(--gray)]">{fee.description || 'Sem descricao'}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-[var(--black)]">{formatCurrencyBRL(fee.value)}</td>
                    <td className="px-6 py-4 text-sm text-[var(--gray)]">
                      {fee.appliesFrom ? new Date(fee.appliesFrom).toLocaleString('pt-BR') : 'Imediata'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${fee.isActive ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>
                        {fee.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(fee as EditableFee)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--gray)] transition-all hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(fee as EditableFee)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--gray)] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-white shadow-2xl">
            <div className="border-b border-[var(--border)] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[var(--black)]">Editar taxa</h2>
                  <p className="text-sm text-[var(--gray)]">{editingFee.key}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-5 p-6">
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Input value={editLabel} onChange={(event) => setEditLabel(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Valor atual (R$)</Label>
                <Input
                  min={0}
                  step="0.01"
                  type="number"
                  value={editValue}
                  onChange={(event) => setEditValue(Number(event.target.value || 0))}
                />
              </div>
              <div className="space-y-2">
                <Label>Descricao complementar</Label>
                <Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} rows={5} />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3 text-sm text-[var(--gray)]">
                <input type="checkbox" checked={editIsActive} onChange={(event) => setEditIsActive(event.target.checked)} />
                Manter taxa ativa
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-l)] px-6 py-4">
              <Button variant="outline" onClick={() => setEditingFee(null)} className="rounded-xl bg-white">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={submitting} className="rounded-xl bg-[var(--black)] text-white hover:bg-black/85">
                {submitting ? 'Salvando...' : 'Salvar alteracoes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
