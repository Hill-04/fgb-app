import { FGB_DEFAULT_FEES } from '@/lib/fee-defaults'

export const FEE_CATEGORIES = ['FILIACAO', 'INSCRICAO', 'TRANSFERENCIA', 'MULTA', 'ARBITRAGEM'] as const

export type FeeCategory = (typeof FEE_CATEGORIES)[number]

export type FeeConfigLike = {
  key: string
  label: string
  value: number
  category: string
  description?: string | null
  isActive?: boolean
  appliesFrom?: Date | string
  updatedAt?: Date | string
}

export type FeeEstimateInput = {
  athleteCount: number
  categoryCount: number
  affiliationType: 'NEW_CLUB' | 'EXISTING_CLUB'
  intraStateTransfers: number
  hasGym: boolean
}

export type FeeEstimateLine = {
  feeKey: string
  feeLabel: string
  category: string
  quantity: number
  unitValue: number
  totalValue: number
  notes?: string
}

export type RegistrationFeeLike = {
  id?: string
  feeKey: string
  feeLabel: string
  quantity: number
  unitValue: number
  totalValue: number
  notes?: string | null
  status: 'PENDING' | 'PAID' | 'WAIVED' | string
  paidAt?: Date | string | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

export const FEE_CATEGORY_LABELS: Record<FeeCategory, string> = {
  FILIACAO: 'Filiacao',
  INSCRICAO: 'Inscricao',
  TRANSFERENCIA: 'Transferencia',
  MULTA: 'Multa',
  ARBITRAGEM: 'Arbitragem',
}

const DEFAULT_FEE_MAP: Map<string, FeeConfigLike> = new Map(
  FGB_DEFAULT_FEES.map((fee) => [fee.key, fee])
)

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDateTimeBR(value?: Date | string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

export function normalizePositiveInteger(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.floor(value)
}

export function getFeeConfigMap(fees: FeeConfigLike[]) {
  return new Map(
    fees
      .filter((fee) => fee.isActive !== false)
      .map((fee) => [fee.key, fee] as const)
  )
}

export function getFeeConfigByKey(fees: FeeConfigLike[], key: string) {
  return getFeeConfigMap(fees).get(key) ?? DEFAULT_FEE_MAP.get(key)
}

function createEstimateLine(
  config: FeeConfigLike | undefined,
  quantity: number,
  notes?: string
): FeeEstimateLine | null {
  if (!config || quantity <= 0) return null

  const unitValue = roundCurrency(Number(config.value) || 0)
  const totalValue = roundCurrency(quantity * unitValue)

  if (totalValue <= 0) return null

  return {
    feeKey: config.key,
    feeLabel: config.label,
    category: config.category,
    quantity,
    unitValue,
    totalValue,
    notes,
  }
}

export function buildFeeEstimate(
  input: FeeEstimateInput,
  fees: FeeConfigLike[]
) {
  const safeAthleteCount = normalizePositiveInteger(input.athleteCount)
  const safeCategoryCount = normalizePositiveInteger(input.categoryCount)
  const safeTransferCount = normalizePositiveInteger(input.intraStateTransfers)

  const exemptFee = getFeeConfigByKey(fees, 'ATLETAS_ISENTOS_POR_CATEGORIA')
  const athleteFee = getFeeConfigByKey(fees, 'REGISTRO_ATLETA')
  const affiliationFee =
    input.affiliationType === 'NEW_CLUB'
      ? getFeeConfigByKey(fees, 'FILIACAO')
      : getFeeConfigByKey(fees, 'ANUIDADE')
  const transferFee = getFeeConfigByKey(fees, 'TRANSFERENCIA_INTRA_ESTADO')

  const exemptAthletes = roundCurrency(safeCategoryCount * Number(exemptFee?.value || 12))
  const payingAthletes = Math.max(0, safeAthleteCount - exemptAthletes)

  const items = [
    createEstimateLine(
      affiliationFee,
      1,
      input.affiliationType === 'NEW_CLUB' ? 'Novo clube filiado' : 'Clube ja filiado'
    ),
    createEstimateLine(
      athleteFee,
      payingAthletes,
      `Atletas acima da cota de ${exemptAthletes} isentos`
    ),
    createEstimateLine(transferFee, safeTransferCount, 'Transferencias intra-estado'),
  ].filter(Boolean) as FeeEstimateLine[]

  const total = roundCurrency(items.reduce((sum, item) => sum + item.totalValue, 0))

  return {
    exemptAthletes,
    payingAthletes,
    items,
    total,
  }
}

export function summarizeRegistrationFees(fees: RegistrationFeeLike[]) {
  const total = roundCurrency(fees.reduce((sum, fee) => sum + Number(fee.totalValue || 0), 0))
  const pendingTotal = roundCurrency(
    fees.filter((fee) => fee.status === 'PENDING').reduce((sum, fee) => sum + Number(fee.totalValue || 0), 0)
  )
  const paidTotal = roundCurrency(
    fees.filter((fee) => fee.status === 'PAID').reduce((sum, fee) => sum + Number(fee.totalValue || 0), 0)
  )
  const waivedTotal = roundCurrency(
    fees.filter((fee) => fee.status === 'WAIVED').reduce((sum, fee) => sum + Number(fee.totalValue || 0), 0)
  )

  return {
    total,
    pendingTotal,
    paidTotal,
    waivedTotal,
    pendingCount: fees.filter((fee) => fee.status === 'PENDING').length,
    paidCount: fees.filter((fee) => fee.status === 'PAID').length,
    waivedCount: fees.filter((fee) => fee.status === 'WAIVED').length,
  }
}

export function groupFeeConfigsByCategory(fees: FeeConfigLike[]) {
  return FEE_CATEGORIES.map((category) => ({
    category,
    label: FEE_CATEGORY_LABELS[category],
    items: fees.filter((fee) => fee.category === category),
  }))
}
