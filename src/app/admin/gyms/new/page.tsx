import GymForm from '../GymForm'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function NewGymPage() {
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
  return (
    <div className="max-w-2xl space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Ginásios</p>
        <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Novo Ginásio</h1>
      </div>
      <GymForm teams={teams} />
    </div>
  )
}
