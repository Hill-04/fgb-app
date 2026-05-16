import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuditAthletesClient } from './AuditAthletesClient'

export const dynamic = 'force-dynamic'

interface AuditResponse {
  ok: boolean
  elapsedMs: number
  summary: {
    total: number
    complete: number
    incomplete: number
    completePct: number
  }
  missingByType: Record<string, number>
  byTeam: Array<{
    teamId: string
    teamName: string
    total: number
    complete: number
    incomplete: number
    incompleteAthletes: Array<{
      athleteId: string
      registrationNumber: number | null
      missingFields: string[]
      totalProblems: number
      isMinor: boolean
      age: number | null
    }>
  }>
  timestamp: string
}

export default async function AuditAthletesPage() {
  const session = await getServerSession(authOptions)
  const isSuperAdmin =
    (session?.user as { isFederationSuperAdmin?: boolean } | undefined)?.isFederationSuperAdmin === true
  const isAdmin = (session?.user as { isAdmin?: boolean } | undefined)?.isAdmin === true

  if (!session || (!isAdmin && !isSuperAdmin)) {
    redirect('/login')
  }

  // Fetch interno usando origem do request
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'https'
  const baseUrl = `${protocol}://${host}`

  const cookieHeader = headersList.get('cookie') ?? ''

  const res = await fetch(`${baseUrl}/api/admin/audit-athletes`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store',
  })

  if (!res.ok) {
    return (
      <div className="p-8">
        <h1 className="fgb-display text-2xl mb-4">Erro</h1>
        <p>
          Falha ao buscar auditoria: {res.status} {res.statusText}
        </p>
      </div>
    )
  }

  const data: AuditResponse = await res.json()

  return <AuditAthletesClient data={data} />
}
