import 'next-auth'

export type MembershipStatus = 'NO_TEAM' | 'PENDING' | 'ACTIVE' | 'REJECTED'
export type GlobalRole = 'ADMIN' | 'TEAM'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isAdmin?: boolean
      role?: GlobalRole
      membershipStatus?: MembershipStatus
      teamId?: string | null
      teamName?: string | null
      teamRole?: string | null
      pendingTeamId?: string | null
      pendingTeamName?: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    isAdmin?: boolean
    role?: GlobalRole
    membershipStatus?: MembershipStatus
    teamId?: string | null
    teamName?: string | null
    teamRole?: string | null
    pendingTeamId?: string | null
    pendingTeamName?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name?: string | null
    isAdmin?: boolean
    role?: GlobalRole
    membershipStatus?: MembershipStatus
    teamId?: string | null
    teamName?: string | null
    teamRole?: string | null
    pendingTeamId?: string | null
    pendingTeamName?: string | null
  }
}
