import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatChampionshipStatus } from '@/lib/utils'
import { ChampionshipTabs } from './ChampionshipTabs'

export default async function ChampionshipLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const championship = await prisma.championship.findUnique({
      where: { id },
      select: { id: true, name: true, status: true }
    })

    if (!championship) notFound()

    const statusBadge: Record<string, string> = {
      DRAFT: 'fgb-badge fgb-badge-outline',
      REGISTRATION_OPEN: 'fgb-badge fgb-badge-verde',
      REGISTRATION_CLOSED: 'fgb-badge fgb-badge-yellow',
      ORGANIZING: 'fgb-badge fgb-badge-outline',
      ONGOING: 'fgb-badge fgb-badge-verde',
      FINISHED: 'fgb-badge fgb-badge-outline',
      ARCHIVED: 'fgb-badge fgb-badge-outline',
    }

    return (
      <div className="space-y-0 pb-10">
        <div className="fgb-card rounded-none border-x-0 border-t-0 px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link
              href="/admin/championships"
              className="fgb-label text-[var(--gray)] hover:text-[var(--verde)] transition-colors"
              style={{ fontSize: 10 }}
            >
              ← Todos os Campeonatos
            </Link>
            <h1 className="fgb-display text-2xl text-[var(--black)] mt-1">
              {championship.name}
            </h1>
          </div>
          <span className={statusBadge[championship.status] || statusBadge.DRAFT}>
            {formatChampionshipStatus(championship.status)}
          </span>
        </div>

        <ChampionshipTabs id={id} status={championship.status} />

        <div className="px-6 pt-6">
          {children}
        </div>
      </div>
    )
  } catch (error) {
    console.error('[CHAMPIONSHIP LAYOUT ERROR]', error)
    return (
      <div className="fgb-card p-10 text-center">
        <p className="fgb-label text-[var(--red)]" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Erro ao carregar o campeonato. Tente novamente.
        </p>
      </div>
    )
  }
}
