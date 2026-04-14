export type MembershipStatus = 'NO_TEAM' | 'PENDING' | 'ACTIVE' | 'REJECTED'
export type GlobalAppRole = 'ADMIN' | 'USER'

type MembershipLike = {
  status?: string | null
  teamId?: string | null
  role?: string | null
  team?: {
    id?: string | null
    name?: string | null
  } | null
} | null

type UserContextSource = {
  isAdmin?: boolean | null
  membershipStatus?: MembershipStatus | null
  teamId?: string | null
  teamName?: string | null
  teamRole?: string | null
  pendingTeamId?: string | null
  pendingTeamName?: string | null
} | null | undefined

export type ResolvedUserContext = {
  isAuthenticated: boolean
  isAdmin: boolean
  globalRole: GlobalAppRole
  membershipStatus: MembershipStatus
  teamId: string | null
  teamName: string | null
  teamRole: string | null
  pendingTeamId: string | null
  pendingTeamName: string | null
  nextRoute: string
}

export function resolveMembershipStatus(membership: MembershipLike): MembershipStatus {
  if (!membership?.status) {
    return 'NO_TEAM'
  }

  if (membership.status === 'ACTIVE') return 'ACTIVE'
  if (membership.status === 'PENDING') return 'PENDING'
  if (membership.status === 'REJECTED') return 'REJECTED'

  return 'NO_TEAM'
}

export function resolveUserContext(source?: UserContextSource): ResolvedUserContext {
  const isAuthenticated = Boolean(source)
  const isAdmin = Boolean(source?.isAdmin)
  const membershipStatus = source?.membershipStatus ?? 'NO_TEAM'
  const globalRole: GlobalAppRole = isAdmin ? 'ADMIN' : 'USER'

  let nextRoute = '/login'

  if (isAuthenticated) {
    if (isAdmin) {
      nextRoute = '/admin/dashboard'
    } else if (membershipStatus === 'ACTIVE') {
      nextRoute = '/team/dashboard'
    } else if (membershipStatus === 'PENDING') {
      nextRoute = '/team/request-status'
    } else {
      nextRoute = '/team/onboarding'
    }
  }

  return {
    isAuthenticated,
    isAdmin,
    globalRole,
    membershipStatus,
    teamId: source?.teamId ?? null,
    teamName: source?.teamName ?? null,
    teamRole: source?.teamRole ?? null,
    pendingTeamId: source?.pendingTeamId ?? null,
    pendingTeamName: source?.pendingTeamName ?? null,
    nextRoute,
  }
}
