import { prisma } from '@/lib/db'
import AthleteFullForm from '../AthleteFullForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewAthletePage() {
  const [teams, categories] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.championshipCategory.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true }, distinct: ['name'] }),
  ])

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <Link href="/admin/athletes" className="inline-flex items-center gap-2 text-sm text-[var(--gray)] hover:text-[var(--verde)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para atletas
      </Link>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--verde)]">BID Federativo</p>
        <h1 className="fgb-display mt-1 text-2xl text-[var(--black)]">Novo Atleta</h1>
      </div>
      <AthleteFullForm teams={teams} categories={categories} />
    </div>
  )
}
