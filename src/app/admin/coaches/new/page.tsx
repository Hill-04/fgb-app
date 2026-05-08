import CoachForm from '../CoachForm'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function NewCoachPage() {
  const teams = await prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })
  return (
    <div className="max-w-3xl space-y-6 pb-12">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">Comissão Técnica</p>
        <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Novo Membro</h1>
      </div>
      <CoachForm teams={teams} />
    </div>
  )
}
