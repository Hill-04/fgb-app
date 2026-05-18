// BLOCO 8 Fase Upload — POST /api/admin/games/[id]/sumula/upload
// Multipart: campo `file` (PDF, max 4MB) + campo `meta` (JSON com placar + status + period scores opcionais)
// Auth: isAdmin OR isFederationSuperAdmin
// Side effects: cria/atualiza GameOfficialReport + nova GameOfficialReportVersion (sourceType='UPLOADED'),
//               atualiza Game.homeScore/awayScore/status, recria GamePeriodScores se informados,
//               dispara recalculateStandings(categoryId) automaticamente.

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { ensureDatabaseSchema } from '@/lib/db-patch'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB (Vercel body limit é 4.5MB)
const ALLOWED_MIME = ['application/pdf']
const VALID_FINAL_STATUS = ['FINISHED', 'WO', 'CANCELED'] as const
type FinalStatus = (typeof VALID_FINAL_STATUS)[number]

interface UploadMeta {
  homeScore?: number
  awayScore?: number
  finalStatus?: FinalStatus
  periodScores?: Array<{ period: number; homeScore: number; awayScore: number }>
  notes?: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureDatabaseSchema()

  // ============ AUTH ============
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, isFederationSuperAdmin: true },
  })
  if (!user?.isAdmin && !user?.isFederationSuperAdmin) {
    return NextResponse.json(
      { ok: false, error: 'Apenas admin pode fazer upload de súmula' },
      { status: 403 }
    )
  }

  // ============ GAME EXISTS ============
  const { id: gameId } = await params
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      status: true,
      championshipId: true,
      categoryId: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  })
  if (!game) {
    return NextResponse.json({ ok: false, error: 'Jogo não encontrado' }, { status: 404 })
  }

  // ============ PARSE MULTIPART ============
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const metaRaw = formData.get('meta') as string | null

  if (!file) {
    return NextResponse.json({ ok: false, error: 'Arquivo PDF ausente' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ ok: false, error: 'PDF maior que 4MB' }, { status: 400 })
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ ok: false, error: 'Aceita apenas PDF' }, { status: 400 })
  }

  let meta: UploadMeta = {}
  if (metaRaw) {
    try {
      meta = JSON.parse(metaRaw) as UploadMeta
    } catch {
      return NextResponse.json({ ok: false, error: 'meta JSON inválido' }, { status: 400 })
    }
  }

  if (meta.finalStatus && !VALID_FINAL_STATUS.includes(meta.finalStatus)) {
    return NextResponse.json(
      { ok: false, error: `finalStatus inválido (use ${VALID_FINAL_STATUS.join(' | ')})` },
      { status: 400 }
    )
  }

  // ============ UPLOAD PDF (Vercel Blob) ============
  const filename = `sumulas/${game.id}/upload-${Date.now()}.pdf`
  const blob = await put(filename, file, { access: 'public' })

  // ============ GAME OFFICIAL REPORT + VERSION ============
  let report = await prisma.gameOfficialReport.findUnique({
    where: { gameId: game.id },
    select: { id: true, currentVersion: true },
  })

  if (!report) {
    report = await prisma.gameOfficialReport.create({
      data: { gameId: game.id, currentVersion: 0 },
      select: { id: true, currentVersion: true },
    })
  }

  // Próximo número de versão = (versões existentes) + 1 — robusto a currentVersion=default(1) sem versões
  const existingVersionsCount = await prisma.gameOfficialReportVersion.count({
    where: { reportId: report.id },
  })
  const nextVersionNumber = existingVersionsCount + 1

  const finalHomeScore = meta.homeScore ?? 0
  const finalAwayScore = meta.awayScore ?? 0

  const newVersion = await prisma.gameOfficialReportVersion.create({
    data: {
      reportId: report.id,
      version: nextVersionNumber,
      finalHomeScore,
      finalAwayScore,
      officialPdfUrl: blob.url,
      sourceType: 'UPLOADED',
      createdByUserId: userId,
      reason: meta.notes,
    },
    select: { id: true, version: true },
  })

  await prisma.gameOfficialReport.update({
    where: { id: report.id },
    data: { currentVersion: nextVersionNumber, officialPdfUrl: blob.url },
  })

  // ============ ATUALIZA SCORES + STATUS DO GAME ============
  let recalcTriggered = false
  if (meta.homeScore !== undefined && meta.awayScore !== undefined) {
    const finalStatus: FinalStatus = meta.finalStatus ?? 'FINISHED'

    await prisma.game.update({
      where: { id: game.id },
      data: {
        homeScore: meta.homeScore,
        awayScore: meta.awayScore,
        status: finalStatus,
      },
    })

    // Period scores (opcional) — limpa e recria
    if (meta.periodScores && meta.periodScores.length > 0) {
      await prisma.gamePeriodScore.deleteMany({ where: { gameId: game.id } })
      for (const ps of meta.periodScores) {
        await prisma.gamePeriodScore
          .create({
            data: {
              gameId: game.id,
              period: ps.period,
              homePoints: ps.homeScore,
              awayPoints: ps.awayScore,
            },
          })
          .catch(() => {
            // unique constraint ou erro — ignora item, segue o resto
          })
      }
    }

    // Recalcula standings (best-effort; se falhar, não bloqueia o upload)
    if (finalStatus === 'FINISHED') {
      try {
        const { recalculateStandings } = await import('@/lib/standings')
        await recalculateStandings(game.categoryId)
        recalcTriggered = true
      } catch {
        // serviço não disponível neste runtime — ignora
      }
    }
  }

  return NextResponse.json({
    ok: true,
    gameId: game.id,
    reportId: report.id,
    versionId: newVersion.id,
    version: newVersion.version,
    pdfUrl: blob.url,
    sourceType: 'UPLOADED',
    recalcTriggered,
  })
}
