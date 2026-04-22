import Link from 'next/link'

import { AdminNewInvoiceForm } from '@/components/finance/admin-new-invoice-form'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminNewFinancialInvoicePage() {
  const [teams, championships] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true, city: true, state: true }, orderBy: { name: 'asc' } }),
    prisma.championship.findMany({ select: { id: true, name: true, year: true }, orderBy: [{ year: 'desc' }, { name: 'asc' }] }),
  ])

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--verde)]">Nova cobranca</p>
          <h1 className="fgb-display mt-2 text-4xl leading-none text-[var(--black)]">Criar fatura</h1>
          <p className="mt-2 text-sm text-[var(--gray)]">Padrao automatico: FGB-ANO-SEQUENCIA, exemplo FGB-2026-000123.</p>
        </div>
        <Link href="/admin/financeiro/faturas" className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--black)] hover:bg-[var(--gray-l)]">
          Voltar para faturas
        </Link>
      </div>

      <AdminNewInvoiceForm
        teams={teams.map((team) => ({ id: team.id, name: `${team.name}${team.city ? ` - ${team.city}/${team.state || 'RS'}` : ''}` }))}
        championships={championships.map((championship) => ({ id: championship.id, name: `${championship.name} ${championship.year || ''}`.trim() }))}
      />
    </div>
  )
}
