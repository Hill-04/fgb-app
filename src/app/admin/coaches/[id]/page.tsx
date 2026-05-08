import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import CoachForm from '../CoachForm'

export const dynamic = 'force-dynamic'

export default async function EditCoachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [coach, teams] = await Promise.all([
    prisma.coachStaff.findUnique({ where: { id } }),
    prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])
  if (!coach) notFound()
  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Comissão Técnica</p>
        <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Editar: {coach.name}</h1>
      </div>
      <CoachForm teams={teams} coach={coach} />
    </div>
  )
}
