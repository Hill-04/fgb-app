import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatChampionshipStatus } from '@/lib/utils'
import { Trophy, Calendar, BarChart3, Users, Settings } from 'lucide-react'

import { ChampionshipTabs } from './ChampionshipTabs'

export default async function ChampionshipLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const championship = await prisma.championship.findUnique({
    where: { id },
    select: { id: true, name: true, status: true }
  })

  if (!championship) notFound()

  const statusColor: Record<string, string> = {
    'DRAFT': 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    'REGISTRATION_OPEN': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'REGISTRATION_CLOSED': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    'ONGOING': 'text-green-400 bg-green-500/10 border-green-500/20',
    'FINISHED': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'ARCHIVED': 'text-slate-600 bg-slate-800/10 border-slate-700/20',
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 md:px-0">
        <div>
          <Link
            href="/admin/championships"
            className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-orange-500 transition-colors"
          >
            ← Todos os Campeonatos
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            {championship.name}
          </h1>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${statusColor[championship.status] || statusColor['DRAFT']}`}>
          {formatChampionshipStatus(championship.status)}
        </span>
      </div>

      <ChampionshipTabs id={id} />

      <div className="px-4 md:px-0">
        {children}
      </div>
    </div>
  )
}
