import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveUserContext } from '@/lib/access/resolve-user-context'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const context = resolveUserContext({
      isAdmin: Boolean(token.isAdmin),
      membershipStatus: token.membershipStatus,
      teamId: token.teamId ?? null,
      teamName: token.teamName ?? null,
      teamRole: token.teamRole ?? null,
      pendingTeamId: token.pendingTeamId ?? null,
      pendingTeamName: token.pendingTeamName ?? null,
    })

    if (pathname.startsWith('/admin')) {
      if (!context.isAdmin) {
        return NextResponse.redirect(new URL(context.nextRoute, req.url))
      }

      return NextResponse.next()
    }

    if (pathname.startsWith('/team')) {
      if (!context.isAuthenticated) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      if (context.isAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }

      const publicTeamRoutes = [
        '/team/onboarding',
        '/team/create',
        '/team/join',
        '/team/request-status',
      ]

      const isPublicTeamRoute = publicTeamRoutes.some((route) => pathname.startsWith(route))

      if (isPublicTeamRoute) {
        if (context.membershipStatus === 'ACTIVE' && pathname.startsWith('/team/onboarding')) {
          return NextResponse.redirect(new URL('/team/dashboard', req.url))
        }

        if (
          context.membershipStatus === 'PENDING' &&
          (pathname.startsWith('/team/create') || pathname.startsWith('/team/join'))
        ) {
          return NextResponse.redirect(new URL('/team/request-status', req.url))
        }

        return NextResponse.next()
      }

      if (context.membershipStatus !== 'ACTIVE') {
        return NextResponse.redirect(new URL(context.nextRoute, req.url))
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
