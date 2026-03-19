import { NextResponse } from 'next/server'
import { StandingService } from '@/services/standing-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { categoryId } = await request.json()
    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId é obrigatório' }, { status: 400 })
    }

    await StandingService.recalculateForCategory(categoryId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recalculating standings:', error)
    return NextResponse.json({ error: 'Erro ao recalcular classificação' }, { status: 500 })
  }
}
