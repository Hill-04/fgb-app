'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { centsFromCurrencyInput, formatCurrencyCentsBRL } from '@/lib/finance'

type SelectOption = {
  id: string
  name: string
  detail?: string | null
}

type InvoiceItemDraft = {
  description: string
  quantity: number
  unitValue: string
}

type AdminNewInvoiceFormProps = {
  teams: SelectOption[]
  championships: SelectOption[]
}

export function AdminNewInvoiceForm({ teams, championships }: AdminNewInvoiceFormProps) {
  const router = useRouter()
  const [teamId, setTeamId] = useState(teams[0]?.id || '')
  const [championshipId, setChampionshipId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [openNow, setOpenNow] = useState(true)
  const [items, setItems] = useState<InvoiceItemDraft[]>([
    { description: 'Taxa administrativa FGB', quantity: 1, unitValue: '0,00' },
  ])
  const [submitting, setSubmitting] = useState(false)

  const normalizedItems = useMemo(() => {
    return items
      .map((item) => {
        const quantity = Math.max(1, Number(item.quantity || 1))
        const unitValueCents = centsFromCurrencyInput(item.unitValue)
        return {
          description: item.description.trim(),
          quantity,
          unitValueCents,
          totalCents: quantity * unitValueCents,
          sourceType: 'MANUAL',
        }
      })
      .filter((item) => item.description && item.totalCents > 0)
  }, [items])

  const totalCents = normalizedItems.reduce((total, item) => total + item.totalCents, 0)

  function updateItem(index: number, patch: Partial<InvoiceItemDraft>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  async function submit() {
    if (!teamId) {
      toast.error('Selecione uma equipe.')
      return
    }
    if (normalizedItems.length === 0) {
      toast.error('Adicione ao menos um item com valor.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/financeiro/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          championshipId: championshipId || null,
          dueDate: dueDate || null,
          notes,
          status: openNow ? 'OPEN' : 'DRAFT',
          items: normalizedItems,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Erro ao criar fatura.')

      toast.success(`Fatura ${payload.number} criada.`)
      router.push(`/admin/financeiro/faturas/${payload.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar fatura.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5 rounded-[32px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Equipe</Label>
            <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold">
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Campeonato</Label>
            <select value={championshipId} onChange={(event) => setChampionshipId(event.target.value)} className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold">
              <option value="">Sem campeonato</option>
              {championships.map((championship) => (
                <option key={championship.id} value={championship.id}>{championship.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Vencimento</Label>
            <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3 text-sm font-semibold text-[var(--gray)]">
            <input type="checkbox" checked={openNow} onChange={(event) => setOpenNow(event.target.checked)} />
            Emitir como aberta
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--verde)]">Composicao</p>
              <h2 className="fgb-display text-2xl leading-none text-[var(--black)]">Itens da fatura</h2>
            </div>
            <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, { description: '', quantity: 1, unitValue: '0,00' }])} className="rounded-xl bg-white">
              <Plus className="mr-2 h-4 w-4" />
              Item
            </Button>
          </div>

          {items.map((item, index) => {
            const unitValueCents = centsFromCurrencyInput(item.unitValue)
            const subtotalCents = Math.max(1, Number(item.quantity || 1)) * unitValueCents

            return (
              <div key={index} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4 md:grid-cols-[1fr_100px_140px_120px_44px] md:items-end">
                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Input value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Qtd</Label>
                  <Input type="number" min={1} value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value || 1) })} />
                </div>
                <div className="space-y-2">
                  <Label>Unitario</Label>
                  <Input value={item.unitValue} onChange={(event) => updateItem(index, { unitValue: event.target.value })} />
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm font-black text-[var(--black)]">
                  {formatCurrencyCentsBRL(subtotalCents)}
                </div>
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="space-y-2">
          <Label>Observacoes</Label>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
        </div>
      </div>

      <aside className="h-fit rounded-[32px] border border-[var(--border)] bg-[var(--black)] p-6 text-white shadow-premium">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--yellow)]">Resumo</p>
        <p className="fgb-display mt-3 text-5xl leading-none">{formatCurrencyCentsBRL(totalCents)}</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-white/62">
          Numeracao automatica no padrao FGB-ANO-SEQUENCIA. Valores armazenados em centavos.
        </p>
        <Button onClick={submit} disabled={submitting || teams.length === 0} className="mt-6 h-12 w-full rounded-2xl bg-[var(--yellow)] text-[var(--black)] hover:bg-[var(--yellow)]/90">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Criar fatura
        </Button>
      </aside>
    </div>
  )
}
