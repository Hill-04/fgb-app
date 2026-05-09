import AdminFeesPage from '@/components/finance/admin-fees-page'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminFinanceFeesPage() {
  const fees = await prisma.feeConfig.findMany({
    orderBy: [{ category: 'asc' }, { label: 'asc' }],
  })

  const initialFees = fees.map(f => ({
    ...f,
    appliesFrom: f.appliesFrom.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  })) as any

  return <AdminFeesPage initialFees={initialFees} />
}
