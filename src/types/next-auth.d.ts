import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isAdmin?: boolean
      teamId?: string | null
      teamName?: string | null
      teamRole?: string | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    isAdmin?: boolean
    teamId?: string | null
    teamName?: string | null
    teamRole?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    name?: string | null
    isAdmin?: boolean
    teamId?: string | null
    teamName?: string | null
    teamRole?: string | null
  }
}
