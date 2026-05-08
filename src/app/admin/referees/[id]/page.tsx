import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import RefereeForm from '../RefereeForm'

export const dynamic = 'force-dynamic'

export default async function EditRefereePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [referee, categories] = await Promise.all([
    prisma.referee.findUnique({ where: { id } }),
    prisma.refereeCategory.findMany({ orderBy: { name: 'asc' } }).catch(() => []),
  ])
  if (!referee) notFound()
  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Árbitros</p>
        <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Editar: {referee.name}</h1>
      </div>
      <RefereeForm categories={categories} referee={referee} />
    </div>
  )
}
