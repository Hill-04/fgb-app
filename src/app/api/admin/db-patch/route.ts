import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Gone',
      message:
        'POST /api/admin/db-patch foi descontinuado. Use POST /api/admin/migrate (autorizado por sessão de super-admin ou header x-migrate-token).',
      replacedBy: '/api/admin/migrate',
    },
    {
      status: 410,
      headers: {
        Link: '</api/admin/migrate>; rel="successor-version"',
      },
    },
  )
}
