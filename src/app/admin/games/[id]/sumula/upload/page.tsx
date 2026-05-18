import { redirect, notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import SumulaUploadClient from '@/components/games/SumulaUploadClient'

export const dynamic = 'force-dynamic'

export default async function AdminSumulaUploadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await ensureDatabaseSchema()

  const session = await getServerSession(authOptions)
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin === true
  const isSuperAdmin =
    (session?.user as { isFederationSuperAdmin?: boolean } | undefined)
      ?.isFederationSuperAdmin === true
  if (!session || (!isAdmin && !isSuperAdmin)) {
    redirect('/login')
  }

  const { id } = await params

  const game = await prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      dateTime: true,
      status: true,
      homeScore: true,
      awayScore: true,
      homeTeam: { select: { id: true, name: true } },
      awayTeam: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      championship: { select: { id: true, name: true, year: true } },
      officialReport: {
        select: {
          id: true,
          currentVersion: true,
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: {
              id: true,
              version: true,
              officialPdfUrl: true,
              sourceType: true,
              createdAt: true,
            },
          },
        },
      },
    },
  })

  if (!game) notFound()

  const latestVersion = game.officialReport?.versions?.[0] ?? null

  return (
    <SumulaUploadClient
      game={{
        id: game.id,
        dateTimeIso: game.dateTime.toISOString(),
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        category: game.category,
        championship: game.championship,
        latestVersion: latestVersion
          ? {
              version: latestVersion.version,
              officialPdfUrl: latestVersion.officialPdfUrl,
              sourceType: latestVersion.sourceType,
              createdAtIso: latestVersion.createdAt.toISOString(),
            }
          : null,
      }}
    />
  )
}
