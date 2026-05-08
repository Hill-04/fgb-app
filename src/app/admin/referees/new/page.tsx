import RefereeForm from '../RefereeForm'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function NewRefereePage() {
  const categories = await prisma.refereeCategory.findMany({ orderBy: { name: 'asc' } }).catch(() => [])
  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Árbitros</p>
        <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Novo Árbitro</h1>
      </div>
      <RefereeForm categories={categories} />
    </div>
  )
}
