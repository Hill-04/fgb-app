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
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        // Support both bcrypt and plain text (for existing MVP users)
        let passwordMatch = false
        if (user.password.startsWith('$2')) {
          passwordMatch = await bcrypt.compare(credentials.password, user.password)
        } else {
          passwordMatch = credentials.password === user.password
        }
        if (!passwordMatch) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.teamId }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.teamId = (user as any).teamId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).teamId = token.teamId
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
}
