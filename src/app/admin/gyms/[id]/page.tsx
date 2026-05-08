import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import GymForm from '../GymForm'

export const dynamic = 'force-dynamic'

export default async function EditGymPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [gym, teams] = await Promise.all([
    prisma.gym.findUnique({ where: { id } }),
    prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])
  if (!gym) notFound()
  return (
    <div className="max-w-2xl space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Ginásios</p>
        <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Editar: {gym.name}</h1>
      </div>
      <GymForm teams={teams} gym={gym} />
    </div>
  )
}
