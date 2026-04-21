'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calculator, Loader2, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { buildFeeEstimate, FeeConfigLike, FeeEstimateLine, formatCurrencyBRL } from '@/lib/fees'

type FeeCalculatorSnapshot = {
  items: FeeEstimateLine[]
  total: number
  payingAthletes: number
  exemptAthletes: number
}

type FeeCalculatorProps = {
  championshipId: string
  registrationId?: string
  allowGenerate?: boolean
  initialCategoryCount?: number
  onEstimateChange?: (snapshot: FeeCalculatorSnapshot) => void
  onGenerated?: () => void
}

export function FeeCalculator({
  championshipId,
  registrationId,
  allowGenerate = false,
  initialCategoryCount = 1,
  onEstimateChange,
  onGenerated,
}: FeeCalculatorProps) {
  const [fees, setFees] = useState<FeeConfigLike[]>([])
  const [loadingFees, setLoadingFees] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [athleteCount, setAthleteCount] = useState(12)
  const [categoryCount, setCategoryCount] = useState(Math.max(1, initialCategoryCount))
  const [affiliationType, setAffiliationType] = useState<'NEW_CLUB' | 'EXISTING_CLUB'>('EXISTING_CLUB')
  const [intraStateTransfers, setIntraStateTransfers] = useState(0)
  const [hasGym, setHasGym] = useState(false)

  useEffect(() => {
    let active = true

    const loadFees = async () => {
      setLoadingFees(true)
      try {
        const response = await fetch('/api/public/fees')
        const data = await response.json()

        if (active && response.ok) {
          setFees(data)
        }
      } catch (error) {
        console.error('[FEE_CALCULATOR][LOAD]', error)
      } finally {
        if (active) {
          setLoadingFees(false)
        }
      }
    }

    loadFees()

    return () => {
      active = false
    }
  }, [championshipId])

  useEffect(() => {
    setCategoryCount(Math.max(1, initialCategoryCount))
  }, [initialCategoryCount])

  const estimate = useMemo(
    () =>
      buildFeeEstimate(
        {
          athleteCount,
          categoryCount,
          affiliationType,
          intraStateTransfers,
          hasGym,
        },
        fees
      ),
    [affiliationType, athleteCount, categoryCount, fees, hasGym, intraStateTransfers]
  )

  useEffect(() => {
    onEstimateChange?.(estimate)
  }, [estimate, onEstimateChange])

  const handleGenerate = async () => {
    if (!registrationId || estimate.items.length === 0) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: estimate.items }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(data.error || 'Nao foi possivel gerar a cobranca.')
        return
      }

      toast.success('Cobranca gerada com sucesso.')
      onGenerated?.()
    } catch (error) {
      console.error('[FEE_CALCULATOR][GENERATE]', error)
      toast.error('Erro inesperado ao gerar a cobranca.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="overflow-hidden border-[var(--border)] bg-white shadow-sm">
      <CardHeader className="border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(20,85,48,0.08),rgba(245,194,0,0.08))]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-[var(--black)]">
              <Calculator className="h-5 w-5 text-[var(--verde)]" />
              Calculadora de Taxas
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-[var(--gray)]">
              Simule o custo estimado da inscricao com base no regimento oficial.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gray)]">Total estimado</p>
            <p className="mt-1 text-2xl font-black text-[var(--black)]">{formatCurrencyBRL(estimate.total)}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">
                Numero de atletas
              </Label>
              <Input
                min={0}
                type="number"
                value={athleteCount}
                onChange={(event) => setAthleteCount(Math.max(0, Number(event.target.value || 0)))}
                className="h-11 rounded-xl border-[var(--border)] bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">
                Numero de categorias
              </Label>
              <Input
                min={1}
                type="number"
                value={categoryCount}
                onChange={(event) => setCategoryCount(Math.max(1, Number(event.target.value || 1)))}
                className="h-11 rounded-xl border-[var(--border)] bg-white"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">
                Tipo de filiacao
              </Label>
              <div className="grid gap-2 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAffiliationType('NEW_CLUB')}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    affiliationType === 'NEW_CLUB'
                      ? 'border-orange-200 bg-orange-50 text-orange-700'
                      : 'border-[var(--border)] bg-white text-[var(--gray)]'
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest">Novo clube</p>
                  <p className="mt-1 text-sm font-semibold">Inclui taxa de filiacao</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAffiliationType('EXISTING_CLUB')}
                  className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                    affiliationType === 'EXISTING_CLUB'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-[var(--border)] bg-white text-[var(--gray)]'
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest">Clube existente</p>
                  <p className="mt-1 text-sm font-semibold">Considera anuidade vigente</p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">
                Transferencias intra-estado
              </Label>
              <Input
                min={0}
                type="number"
                value={intraStateTransfers}
                onChange={(event) => setIntraStateTransfers(Math.max(0, Number(event.target.value || 0)))}
                className="h-11 rounded-xl border-[var(--border)] bg-white"
              />
            </div>

            <div className="flex items-end">
              <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--gray-l)] px-4 text-sm text-[var(--gray)]">
                <input
                  type="checkbox"
                  checked={hasGym}
                  onChange={(event) => setHasGym(event.target.checked)}
                />
                Possui ginasio para sediar jogos
              </label>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--gray-l)] p-4 md:col-span-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Leitura automatica</p>
              <p className="mt-2 text-sm text-[var(--gray)]">
                Cota isenta considerada: <span className="font-black text-[var(--black)]">{estimate.exemptAthletes} atleta(s)</span>.
                {' '}Atletas pagantes: <span className="font-black text-[var(--black)]">{estimate.payingAthletes}</span>.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--gray-l)] p-4 shadow-inner">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[var(--verde)]" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--black)]">Resumo ao vivo</h3>
            </div>

            {loadingFees ? (
              <div className="flex min-h-[240px] items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-white">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--verde)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gray)]">Carregando taxas</span>
              </div>
            ) : (
              <>
                <Table className="rounded-2xl border border-[var(--border)] bg-white">
                  <TableHeader className="bg-white">
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Valor Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimate.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-sm text-[var(--gray)]">
                          Nenhuma taxa calculada com os parametros atuais.
                        </TableCell>
                      </TableRow>
                    ) : (
                      estimate.items.map((item) => (
                        <TableRow key={`${item.feeKey}-${item.notes ?? 'base'}`}>
                          <TableCell className="max-w-[240px] whitespace-normal">
                            <p className="font-semibold text-[var(--black)]">{item.feeLabel}</p>
                            {item.notes && <p className="text-xs text-[var(--gray)]">{item.notes}</p>}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrencyBRL(item.unitValue)}</TableCell>
                          <TableCell className="text-right font-black text-[var(--black)]">
                            {formatCurrencyBRL(item.totalValue)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-[var(--gray-l)] hover:bg-[var(--gray-l)]">
                      <TableCell colSpan={3} className="font-black uppercase tracking-[0.2em] text-[var(--black)]">
                        Total estimado
                      </TableCell>
                      <TableCell className="text-right text-lg font-black text-[var(--black)]">
                        {formatCurrencyBRL(estimate.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <p className="mt-4 text-xs text-[var(--gray)]">
                  Valores baseados no Regimento de Taxas FGB 2018. Sujeito a atualizacao pela FGB.
                </p>

                {allowGenerate && registrationId && estimate.items.length > 0 && (
                  <Button
                    onClick={handleGenerate}
                    disabled={submitting}
                    className="mt-4 h-11 w-full rounded-xl bg-[var(--black)] text-white hover:bg-black/85"
                  >
                    {submitting ? 'Gerando cobranca...' : 'Gerar cobranca'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
