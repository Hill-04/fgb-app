import { put } from '@vercel/blob'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file || !file.size) return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 })

  const maxMB = 5
  if (file.size > maxMB * 1024 * 1024)
    return NextResponse.json({ error: `Arquivo muito grande (máximo ${maxMB}MB)` }, { status: 413 })

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 415 })

  const ext = file.name.split('.').pop() ?? 'bin'
  const filename = `fgb/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const blob = await put(filename, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
