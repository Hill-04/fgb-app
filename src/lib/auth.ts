import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./prisma"
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
            membership: {
              where: { status: 'ACTIVE' },
              include: {
                team: true
              }
            }
          }
        })

        if (!user) return null

        // Verificar senha (sempre bcrypt agora)
        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          teamId: user.membership?.team.id || null,
          teamName: user.membership?.team.name || null,
          teamRole: user.membership?.role || null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = (user as any).name
        token.isAdmin = (user as any).isAdmin
        token.teamId = (user as any).teamId
        token.teamName = (user as any).teamName
        token.teamRole = (user as any).teamRole
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).name = token.name
        ;(session.user as any).isAdmin = token.isAdmin
        ;(session.user as any).teamId = token.teamId
        ;(session.user as any).teamName = token.teamName
        ;(session.user as any).teamRole = token.teamRole
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
}
