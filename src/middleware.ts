import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const { role, membershipStatus, isAdmin } = token as {
      role?: string
      membershipStatus?: string
      isAdmin?: boolean
    }

    // ── Admin routes ──────────────────────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/team/dashboard', req.url))
      }
      return NextResponse.next()
    }

    // ── Team routes ───────────────────────────────────────────────────────────
    if (pathname.startsWith('/team')) {
      // Unauthenticated (no role) → login
      if (!role) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      // Admin tentando acessar área de equipe → manda pro admin
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }

      // Rotas que qualquer usuário autenticado pode acessar independente de equipe
      const publicTeamRoutes = [
        '/team/onboarding',
        '/team/create',
        '/team/join',
        '/team/request-status',
      ]
      const isPublicTeamRoute = publicTeamRoutes.some(r => pathname.startsWith(r))

      if (isPublicTeamRoute) {
        // Usuário com equipe ativa tentando acessar onboarding → redireciona pro dashboard
        if (membershipStatus === 'ACTIVE' && pathname.startsWith('/team/onboarding')) {
          return NextResponse.redirect(new URL('/team/dashboard', req.url))
        }
        return NextResponse.next()
      }

      // Rotas protegidas do portal da equipe — exige ACTIVE
      if (membershipStatus !== 'ACTIVE') {
        if (membershipStatus === 'PENDING') {
          return NextResponse.redirect(new URL('/team/request-status', req.url))
        }
        // NO_TEAM ou REJECTED → onboarding
        return NextResponse.redirect(new URL('/team/onboarding', req.url))
      }

      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/team/:path*', '/admin/:path*'],
}
