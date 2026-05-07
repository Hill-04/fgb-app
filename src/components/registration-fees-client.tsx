'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Ban, CheckCircle2, FileDown, Loader2, Plus, Receipt, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { FeeCalculator } from '@/components/fee-calculator'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrencyBRL, formatDateTimeBR } from '@/lib/fees'

type RegistrationFeeRecord = {
  id: string
  feeKey: string
  feeLabel: string
  quantity: number
  unitValue: number
  totalValue: number
  notes?: string | null
  status: 'PENDING' | 'PAID' | 'WAIVED'
  paidAt?: string | null
  createdAt: string
  updatedAt: string
}

type RegistrationFeesPayload = {
  registration: {
    id: string
    status: string
    registeredAt: string
    team: {
      id: string
      name: string
      totalFeesOwed: number
    }
    championship: {
      id: string
      name: string
    }
  }
  fees: RegistrationFeeRecord[]
  summary: {
    total: number
    pendingTotal: number
    paidTotal: number
    waivedTotal: number
  }
}

type RegistrationFeesClientProps = {
  mode: 'admin' | 'team'
  championshipId: string
  registrationId: string
}

const STATUS_BADGES: Record<RegistrationFeeRecord['status'], string> = {
  PENDING: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  PAID: 'border-green-200 bg-green-50 text-green-700',
  WAIVED: 'border-slate-200 bg-slate-100 text-slate-600',
}

export function RegistrationFeesClient({
  mode,
  championshipId,
  registrationId,
}: RegistrationFeesClientProps) {
  const [data, setData] = useState<RegistrationFeesPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualFeeKey, setManualFeeKey] = useState('CUSTOM_ADMIN')
  const [manualFeeLabel, setManualFeeLabel] = useState('')
  const [manualQuantity, setManualQuantity] = useState(1)
  const [manualUnitValue, setManualUnitValue] = useState(0)
  const [manualNotes, setManualNotes] = useState('')

  const endpoint =
    mode === 'admin'
      ? `/api/admin/registrations/${registrationId}/fees`
      : `/api/registrations/${registrationId}/fees`

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(endpoint)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao carregar taxas.')
      }

      setData(payload)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar taxas.')
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadData()
  }, [loadData])

  const historyItems = useMemo(() => {
    if (!data) return []

    return data.fees.flatMap((fee) => {
      const items = [
        {
          id: `${fee.id}-created`,
          feeLabel: fee.feeLabel,
          event: 'Taxa criada',
          date: fee.createdAt,
        },
      ]

      if (fee.status === 'PAID' && fee.paidAt) {
        items.push({
          id: `${fee.id}-paid`,
          feeLabel: fee.feeLabel,
          event: 'Taxa marcada como paga',
          date: fee.paidAt,
        })
      }

      if (fee.status === 'WAIVED') {
        items.push({
          id: `${fee.id}-waived`,
          feeLabel: fee.feeLabel,
          event: 'Taxa dispensada',
          date: fee.updatedAt,
        })
      }

      return items
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data])

  const handleStatusChange = async (feeId: string, status: 'PAID' | 'WAIVED') => {
    setPendingAction(feeId + status)

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/fees`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeId, status }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao atualizar taxa.')
      }

      setData(payload)
      toast.success(status === 'PAID' ? 'Taxa marcada como paga.' : 'Taxa dispensada.')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar taxa.')
    } finally {
      setPendingAction(null)
    }
  }

  const handleAddManualFee = async () => {
    if (!manualFeeLabel.trim() || manualUnitValue <= 0) {
      toast.error('Preencha a descricao e o valor da taxa.')
      return
    }

    setPendingAction('manual-fee')

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feeKey: manualFeeKey || 'CUSTOM_ADMIN',
          feeLabel: manualFeeLabel,
          quantity: manualQuantity,
          unitValue: manualUnitValue,
          notes: manualNotes || null,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Erro ao criar taxa manual.')
      }

      setData(payload)
      setShowManualModal(false)
      setManualFeeKey('CUSTOM_ADMIN')
      setManualFeeLabel('')
      setManualQuantity(1)
      setManualUnitValue(0)
      setManualNotes('')
      toast.success('Taxa manual adicionada.')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar taxa manual.')
    } finally {
      setPendingAction(null)
    }
  }

  const handleExportPdf = async () => {
    if (!data) return

    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text(`Taxas da Inscricao - ${data.registration.team.name}`, 14, 16)
    doc.setFontSize(10)
    doc.text(`Campeonato: ${data.registration.championship.name}`, 14, 24)
    doc.text(`Gerado em: ${formatDateTimeBR(new Date())}`, 14, 30)

    autoTable(doc, {
      startY: 38,
      head: [['Item', 'Qtd', 'Valor Unit.', 'Subtotal', 'Status']],
      body: data.fees.map((fee) => [
        fee.feeLabel,
        String(fee.quantity),
        formatCurrencyBRL(fee.unitValue),
        formatCurrencyBRL(fee.totalValue),
        fee.status,
      ]),
    })

    const finalY = (doc as any).lastAutoTable?.finalY ?? 60
    doc.text(`Total: ${formatCurrencyBRL(data.summary.total)}`, 14, finalY + 12)
    doc.text(`Pendente: ${formatCurrencyBRL(data.summary.pendingTotal)}`, 14, finalY + 18)
    doc.text(`Pago: ${formatCurrencyBRL(data.summary.paidTotal)}`, 14, finalY + 24)

    doc.save(`taxas-inscricao-${data.registration.team.name}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--verde)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gray)]">Carregando taxas</span>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Link
            href={mode === 'admin' ? `/admin/championships/${championshipId}/registrations` : '/team/registrations'}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)] transition-colors hover:text-[var(--black)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar
          </Link>
          <h1 className="fgb-display text-4xl leading-none text-[var(--black)]">
            Taxas da Inscricao - {data.registration.team.name}
          </h1>
          <p className="text-sm text-[var(--gray)]">
            {data.registration.championship.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {mode === 'admin' && (
            <>
              <Button
                onClick={() => setShowManualModal(true)}
                variant="outline"
                className="h-11 rounded-xl border-[var(--border)] bg-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar taxa manual
              </Button>
              <Button
                onClick={handleExportPdf}
                className="h-11 rounded-xl bg-[var(--black)] text-white hover:bg-black/85"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[var(--border)] bg-white shadow-sm">
          <CardHeader>
            <CardDescription>Total geral</CardDescription>
            <CardTitle className="text-3xl font-black text-[var(--black)]">
              {formatCurrencyBRL(data.summary.total)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardHeader>
            <CardDescription className="text-red-700">Pendente</CardDescription>
            <CardTitle className="text-3xl font-black text-red-700">
              {formatCurrencyBRL(data.summary.pendingTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50 shadow-sm">
          <CardHeader>
            <CardDescription className="text-green-700">Pago</CardDescription>
            <CardTitle className="text-3xl font-black text-green-700">
              {formatCurrencyBRL(data.summary.paidTotal)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {mode === 'admin' && (
        <FeeCalculator
          championshipId={championshipId}
          registrationId={registrationId}
          allowGenerate={data.fees.length === 0}
          onGenerated={loadData}
        />
      )}

      <Card className="border-[var(--border)] bg-white shadow-sm">
        <CardHeader className="border-b border-[var(--border)]">
          <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-[var(--black)]">
            <Receipt className="h-5 w-5 text-[var(--verde)]" />
            Itens de cobranca
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[var(--gray-l)]">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Valor Unit.</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Status</TableHead>
                {mode === 'admin' && <TableHead className="text-right">Acoes</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={mode === 'admin' ? 6 : 5} className="py-12 text-center text-sm text-[var(--gray)]">
                    Nenhuma taxa cadastrada para esta inscricao ainda.
                  </TableCell>
                </TableRow>
              ) : (
                data.fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="max-w-[260px] whitespace-normal">
                      <p className="font-semibold text-[var(--black)]">{fee.feeLabel}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--gray)]">{fee.feeKey}</p>
                      {fee.notes && <p className="mt-1 text-xs text-[var(--gray)]">{fee.notes}</p>}
                    </TableCell>
                    <TableCell>{fee.quantity}</TableCell>
                    <TableCell>{formatCurrencyBRL(fee.unitValue)}</TableCell>
                    <TableCell className="font-black text-[var(--black)]">{formatCurrencyBRL(fee.totalValue)}</TableCell>
                    <TableCell>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${STATUS_BADGES[fee.status]}`}>
                        {fee.status}
                      </span>
                    </TableCell>
                    {mode === 'admin' && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={fee.status === 'PAID' || pendingAction === fee.id + 'PAID'}
                            onClick={() => handleStatusChange(fee.id, 'PAID')}
                            className="h-9 rounded-xl border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                            Pago
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={fee.status === 'WAIVED' || pendingAction === fee.id + 'WAIVED'}
                            onClick={() => handleStatusChange(fee.id, 'WAIVED')}
                            className="h-9 rounded-xl border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                          >
                            <Ban className="mr-1 h-3.5 w-3.5" />
                            Dispensar
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-[var(--border)] bg-white shadow-sm">
        <CardHeader className="border-b border-[var(--border)]">
          <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-[var(--black)]">
            <Wallet className="h-5 w-5 text-[var(--verde)]" />
            Historico de alteracoes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          {historyItems.length === 0 ? (
            <p className="text-sm text-[var(--gray)]">Nenhum evento registrado ainda.</p>
          ) : (
            historyItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--black)]">{item.feeLabel}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--gray)]">{item.event}</p>
                <p className="mt-1 text-xs text-[var(--gray)]">{formatDateTimeBR(item.date)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {showManualModal && mode === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-[var(--border)] bg-white shadow-2xl">
            <div className="border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-2xl font-black text-[var(--black)]">Adicionar taxa manual</h2>
              <p className="mt-1 text-sm text-[var(--gray)]">Use para complementar cobrancas fora da calculadora.</p>
            </div>
            <div className="grid gap-4 p-6">
              <div className="space-y-2">
                <Label>Codigo</Label>
                <Input value={manualFeeKey} onChange={(event) => setManualFeeKey(event.target.value.toUpperCase())} />
              </div>
              <div className="space-y-2">
                <Label>Descricao</Label>
                <Input value={manualFeeLabel} onChange={(event) => setManualFeeLabel(event.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    min={1}
                    type="number"
                    value={manualQuantity}
                    onChange={(event) => setManualQuantity(Math.max(1, Number(event.target.value || 1)))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor unitario</Label>
                  <Input
                    min={0}
                    step="0.01"
                    type="number"
                    value={manualUnitValue}
                    onChange={(event) => setManualUnitValue(Number(event.target.value || 0))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observacoes</Label>
                <Textarea value={manualNotes} onChange={(event) => setManualNotes(event.target.value)} rows={4} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--gray-l)] px-6 py-4">
              <Button variant="outline" onClick={() => setShowManualModal(false)} className="rounded-xl bg-white">
                Cancelar
              </Button>
              <Button
                onClick={handleAddManualFee}
                disabled={pendingAction === 'manual-fee'}
                className="rounded-xl bg-[var(--black)] text-white hover:bg-black/85"
              >
                {pendingAction === 'manual-fee' ? 'Salvando...' : 'Salvar taxa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
