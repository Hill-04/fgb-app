'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { centsFromCurrencyInput, formatCurrencyCentsBRL } from '@/lib/finance'

type InvoiceItem = {
  id: string
  registrationFeeId?: string | null
  feeKey?: string | null
  description: string
  quantity: number
  unitValueCents: number
  totalCents: number
  sourceType: string
}

type AdminInvoiceItemsManagerProps = {
  invoiceId: string
  items: InvoiceItem[]
  canAddItem: boolean
  canRemoveManualItem: boolean
  lockedReason?: string
}

function getSourceLabel(item: InvoiceItem) {
  if (item.sourceType === 'REGISTRATION_FEE' || item.registrationFeeId) return 'Inscricao'
  if (item.sourceType === 'DISCOUNT') return 'Desconto'
  if (item.sourceType === 'ADJUSTMENT') return 'Ajuste'
  return 'Manual'
}

function getSourceClass(item: InvoiceItem) {
  if (item.sourceType === 'REGISTRATION_FEE' || item.registrationFeeId) return 'border-green-200 bg-green-50 text-green-700'
  if (item.sourceType === 'DISCOUNT') return 'border-yellow-200 bg-yellow-50 text-yellow-800'
  if (item.sourceType === 'ADJUSTMENT') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

export function AdminInvoiceItemsManager({
  invoiceId,
  items,
  canAddItem,
  canRemoveManualItem,
  lockedReason,
}: AdminInvoiceItemsManagerProps) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [amount, setAmount] = useState('')
  const [sourceType, setSourceType] = useState('MANUAL')
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function addItem() {
    const amountCents = centsFromCurrencyInput(amount)
    if (!description.trim() || amountCents <= 0) {
      toast.error('Informe descricao e valor validos.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/financeiro/invoices/${invoiceId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, quantity, amountCents, sourceType }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Erro ao adicionar item.')

      toast.success(sourceType === 'DISCOUNT' ? 'Desconto aplicado.' : 'Item adicionado.')
      setDescription('')
      setQuantity(1)
      setAmount('')
      setSourceType('MANUAL')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar item.')
    } finally {
      setSubmitting(false)
    }
  }

  async function removeItem(itemId: string) {
    setRemovingId(itemId)
    try {
      const response = await fetch(`/api/admin/financeiro/invoices/${invoiceId}/items/${itemId}`, {
        method: 'DELETE',
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Erro ao remover item.')

      toast.success('Item removido com auditoria.')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover item.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="overflow-hidden rounded-[32px] border border-[var(--border)] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-[var(--gray-l)] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--gray)]">Composicao oficial</p>
          <h2 className="fgb-display mt-1 text-2xl leading-none text-[var(--black)]">Itens cobrados</h2>
        </div>
        <p className="max-w-lg text-xs font-semibold leading-5 text-[var(--gray)]">
          Taxas da inscricao ficam protegidas. Itens manuais, descontos e ajustes seguem a regra do status da fatura.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-6 py-4 text-left text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Item</th>
              <th className="px-6 py-4 text-center text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Origem</th>
              <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Qtd</th>
              <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Unitario</th>
              <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Subtotal</th>
              <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-[var(--gray)]">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const canRemove = canRemoveManualItem && !item.registrationFeeId && item.sourceType !== 'REGISTRATION_FEE'
              return (
                <tr key={item.id} className="border-b border-[var(--border)]">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[var(--black)]">{item.description}</p>
                    <p className="mt-1 text-xs text-[var(--gray)]">{item.feeKey || item.sourceType}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${getSourceClass(item)}`}>
                      {getSourceLabel(item)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-semibold">{formatCurrencyCentsBRL(item.unitValueCents)}</td>
                  <td className={`px-6 py-4 text-right font-black ${item.totalCents < 0 ? 'text-yellow-700' : 'text-[var(--black)]'}`}>
                    {formatCurrencyCentsBRL(item.totalCents)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canRemove || removingId === item.id}
                      onClick={() => removeItem(item.id)}
                      className="rounded-xl bg-white text-red-700 hover:bg-red-50"
                    >
                      {removingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-[var(--border)] p-5">
        {!canAddItem ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4 text-sm font-semibold text-[var(--gray)]">
            {lockedReason || 'A composicao financeira esta bloqueada para este status.'}
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-[1.4fr_150px_160px_160px_auto] lg:items-end">
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Ajuste administrativo" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select
                value={sourceType}
                onChange={(event) => setSourceType(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="MANUAL">Manual</option>
                <option value="DISCOUNT">Desconto</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Qtd</Label>
              <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} />
            </div>
            <div className="space-y-2">
              <Label>Valor unitario</Label>
              <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" />
            </div>
            <Button onClick={addItem} disabled={submitting} className="h-10 rounded-xl bg-[var(--verde)] text-white hover:bg-[var(--verde)]/90">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Adicionar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
