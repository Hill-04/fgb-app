import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              include: { team: true },
              orderBy: { requestedAt: 'desc' },
              take: 1,
            }
          }
        })

        if (!user) {
          console.error(`[AUTH_ERROR] User not found: "${credentials.email}"`)
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) {
          console.error(`[AUTH_ERROR] Password mismatch for: "${credentials.email}". Password length provided: ${credentials.password.length}`)
          return null
        }
        console.log(`[AUTH_SUCCESS] login: ${credentials.email}`)

        // Dynamic Supreme Admin Check
        const supremeAdminEmail = process.env.SUPREME_ADMIN_EMAIL
        const isAdmin = user.email === supremeAdminEmail ? true : user.isAdmin

        // Resolver membershipStatus explicitamente (pega o mais recente)
        const membership = user.memberships?.[0] ?? null
        let membershipStatus: 'NO_TEAM' | 'PENDING' | 'ACTIVE' | 'REJECTED' = 'NO_TEAM'
        if (membership) {
          if (membership.status === 'ACTIVE') membershipStatus = 'ACTIVE'
          else if (membership.status === 'PENDING') membershipStatus = 'PENDING'
          else if (membership.status === 'REJECTED') membershipStatus = 'REJECTED'
        }

        const activeMembership = membership?.status === 'ACTIVE' ? membership : null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin,
          role: isAdmin ? 'ADMIN' : 'TEAM',
          membershipStatus,
          teamId: activeMembership?.team?.id ?? null,
          teamName: activeMembership?.team?.name ?? null,
          teamRole: activeMembership?.role ?? null,
          pendingTeamId: membership?.status === 'PENDING' ? membership.teamId : null,
          pendingTeamName: membership?.status === 'PENDING' ? (membership.team?.name ?? null) : null,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.name = (user as any).name
        token.isAdmin = (user as any).isAdmin
        token.role = (user as any).role
        token.membershipStatus = (user as any).membershipStatus
        token.teamId = (user as any).teamId
        token.teamName = (user as any).teamName
        token.teamRole = (user as any).teamRole
        token.pendingTeamId = (user as any).pendingTeamId
        token.pendingTeamName = (user as any).pendingTeamName
      }

      // Re-fetch membership when session is explicitly refreshed (e.g. after approval)
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            memberships: {
              include: { team: true },
              orderBy: { requestedAt: 'desc' },
              take: 1,
            }
          }
        })
        if (fresh) {
          const membership = fresh.memberships?.[0] ?? null
          let membershipStatus: 'NO_TEAM' | 'PENDING' | 'ACTIVE' | 'REJECTED' = 'NO_TEAM'
          if (membership) {
            if (membership.status === 'ACTIVE') membershipStatus = 'ACTIVE'
            else if (membership.status === 'PENDING') membershipStatus = 'PENDING'
            else if (membership.status === 'REJECTED') membershipStatus = 'REJECTED'
          }
          const activeMembership = membership?.status === 'ACTIVE' ? membership : null
          token.membershipStatus = membershipStatus
          token.teamId = activeMembership?.team?.id ?? null
          token.teamName = activeMembership?.team?.name ?? null
          token.teamRole = activeMembership?.role ?? null
          token.pendingTeamId = membership?.status === 'PENDING' ? membership.teamId : null
          token.pendingTeamName = membership?.status === 'PENDING' ? (membership.team?.name ?? null) : null
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).name = token.name
        ;(session.user as any).isAdmin = token.isAdmin
        ;(session.user as any).role = token.role
        ;(session.user as any).membershipStatus = token.membershipStatus
        ;(session.user as any).teamId = token.teamId
        ;(session.user as any).teamName = token.teamName
        ;(session.user as any).teamRole = token.teamRole
        ;(session.user as any).pendingTeamId = token.pendingTeamId
        ;(session.user as any).pendingTeamName = token.pendingTeamName
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
}
