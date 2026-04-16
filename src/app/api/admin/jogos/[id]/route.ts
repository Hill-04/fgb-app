import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const supabase = await createClient()

    // @ts-ignore
    const { data, error } = await (supabase as any)
      .from('games')
      .select(`
        *,
        home_team:teams!home_team_id(*),
        away_team:teams!away_team_id(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()

    const updateData: any = {}
    if (body.status) updateData.status = body.status
    if (body.scheduled_at) updateData.scheduled_at = body.scheduled_at
    if (body.venue !== undefined) updateData.venue = body.venue
    if (body.round !== undefined) updateData.round = body.round
    if (body.home_score !== undefined) updateData.home_score = body.home_score
    if (body.away_score !== undefined) updateData.away_score = body.away_score
    if (body.notes !== undefined) updateData.notes = body.notes

    // @ts-ignore
    const { data, error } = await (supabase as any)
      .from('games')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const supabase = await createClient()

    // Logical delete as requested: cancel the game instead of physical removal
    // @ts-ignore
    const { data, error } = await (supabase as any)
      .from('games')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ message: 'Jogo cancelado com sucesso', data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
