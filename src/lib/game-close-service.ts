/**
 * Game Close Service — Fase 5
 *
 * Servico transacional que fecha um jogo de forma segura:
 *   1. Valida estado do jogo (state machine)
 *   2. Valida paridade (Sum stats jogador == placar oficial)
 *   3. Transita lifecycleState: LIVE/ENDED/UNDER_REVIEW -> CONFIRMED
 *   4. Cria snapshot em GameOfficialReportVersion
 *   5. Atualiza GameOfficialReport (currentVersion, finalizedAt)
 *   6. Recalcula Standings da categoria
 *   7. Grava GameAuditLog
 *
 * Imutabilidade:
 *   - CONFIRMED/PUBLISHED nao podem ser fechados de novo — precisam transitar
 *     para UNDER_REVIEW primeiro via requestReview()
 *   - Cada chamada cria uma nova versao do GameOfficialReportVersion
 *   - Audit log registra tudo
 *
 * Coexistencia com finalizeGame() legacy:
 *   - Esta funcao e adicional, nao substitui. Pode ser chamada em paralelo.
 *   - finalizeGame() continua funcionando para legacy callers ate migracao gradual.
 */

import { prisma } from '@/lib/db'
import { recalculateStandings } from '@/lib/standings'
import {
  assertCanTransition,
  type GameLifecycleState,
  validateParityNumbers,
} from '@/lib/game-lifecycle'

// ─────────────── Types ───────────────

export type CloseGameInput = {
  gameId: string
  actorUserId?: string
  /** Se true, fecha mesmo com erros de paridade (uso administrativo excepcional, audit logado). */
  allowParityErrors?: boolean
  /** Motivo (obrigatorio quando vindo de UNDER_REVIEW). */
  reason?: string
}

export type CloseGameResult = {
  ok: boolean
  gameId: string
  fromState: GameLifecycleState
  newState: GameLifecycleState
  versionCreated: number
  parityErrors: string[]
  warnings: string[]
  reportId?: string
}

export type RequestReviewInput = {
  gameId: string
  reason: string
  actorUserId?: string
}

// ─────────────── closeGame ───────────────

export async function closeGame(input: CloseGameInput): Promise<CloseGameResult> {
  const { gameId, actorUserId, allowParityErrors = false, reason } = input

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      categoryId: true,
      championshipId: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      lifecycleState: true,
      status: true,
    },
  })
  if (!game) throw new Error(`Jogo ${gameId} nao encontrado`)

  const fromState = (game.lifecycleState ?? 'SCHEDULED') as GameLifecycleState

  // Bloqueia estados imutaveis sem transitar via UNDER_REVIEW
  if (fromState === 'CONFIRMED' || fromState === 'PUBLISHED') {
    return {
      ok: false,
      gameId,
      fromState,
      newState: fromState,
      versionCreated: 0,
      parityErrors: [
        `Jogo ja esta em estado ${fromState}. Use requestReview() para revisao formal antes de re-fechar.`,
      ],
      warnings: [],
    }
  }

  // Aceita: LIVE (corte abrupto), ENDED (fim natural aguardando confirmacao), UNDER_REVIEW (re-confirmacao apos correcao)
  const validSourceStates: GameLifecycleState[] = ['LIVE', 'ENDED', 'UNDER_REVIEW', 'SCHEDULED', 'LINEUP_LOCKED']
  if (!validSourceStates.includes(fromState)) {
    throw new Error(`Nao e possivel fechar jogo no estado ${fromState}`)
  }

  // ─── Paridade ───
  const stats = await prisma.gamePlayerStatLine.findMany({
    where: { gameId },
    select: { teamId: true, points: true },
  })

  const homePoints = stats
    .filter(s => s.teamId === game.homeTeamId)
    .reduce((acc, s) => acc + s.points, 0)
  const awayPoints = stats
    .filter(s => s.teamId === game.awayTeamId)
    .reduce((acc, s) => acc + s.points, 0)

  const parity = validateParityNumbers({
    homeExpected: game.homeScore ?? 0,
    awayExpected: game.awayScore ?? 0,
    homePlayerPointsSum: homePoints,
    awayPlayerPointsSum: awayPoints,
  })

  if (!parity.ok && !allowParityErrors) {
    return {
      ok: false,
      gameId,
      fromState,
      newState: fromState,
      versionCreated: 0,
      parityErrors: parity.errors,
      warnings: [
        'Para fechar mesmo assim, passe allowParityErrors: true (acao administrativa, audit logada).',
      ],
    }
  }

  // ─── Transacao de fechamento ───
  const newState: GameLifecycleState = 'CONFIRMED'

  const txResult = await prisma.$transaction(async (tx) => {
    // 1. Atualiza Game
    await tx.game.update({
      where: { id: gameId },
      data: {
        lifecycleState: newState,
        lifecycleVersion: { increment: 1 },
        // Manten status legacy em sincronia para nao quebrar callers antigos
        status: 'FINISHED',
      },
    })

    // 2. GameOfficialReport — find or create, increment version
    let report = await tx.gameOfficialReport.findUnique({ where: { gameId } })
    const newVersion = (report?.currentVersion ?? 0) + 1

    if (!report) {
      report = await tx.gameOfficialReport.create({
        data: {
          gameId,
          finalHomeScore: game.homeScore ?? 0,
          finalAwayScore: game.awayScore ?? 0,
          finalizedAt: new Date(),
          signedOffByUserId: actorUserId ?? null,
          currentVersion: newVersion,
        },
      })
    } else {
      await tx.gameOfficialReport.update({
        where: { id: report.id },
        data: {
          finalHomeScore: game.homeScore ?? 0,
          finalAwayScore: game.awayScore ?? 0,
          finalizedAt: new Date(),
          signedOffByUserId: actorUserId ?? null,
          currentVersion: newVersion,
        },
      })
    }

    // 3. Snapshot imutavel da versao
    const versionReason =
      fromState === 'UNDER_REVIEW'
        ? reason || 'Re-confirmacao apos revisao'
        : 'Fechamento inicial'

    await tx.gameOfficialReportVersion.create({
      data: {
        reportId: report.id,
        version: newVersion,
        finalHomeScore: game.homeScore ?? 0,
        finalAwayScore: game.awayScore ?? 0,
        finalizedAt: new Date(),
        signedOffByUserId: actorUserId ?? null,
        createdByUserId: actorUserId ?? null,
        reason: versionReason,
      },
    })

    // 4. Audit log
    await tx.gameAuditLog.create({
      data: {
        gameId,
        actionType: 'GAME_CLOSED',
        actorUserId: actorUserId ?? null,
        targetEntity: 'Game',
        targetEntityId: gameId,
        description: `Jogo fechado: ${fromState} -> ${newState} (v${newVersion})${
          !parity.ok ? ' [com erros de paridade — forced]' : ''
        }`,
        metaJson: JSON.stringify({
          from: fromState,
          to: newState,
          version: newVersion,
          reason: versionReason,
          parity: {
            ok: parity.ok,
            homeExpected: parity.homeExpected,
            homeCalculated: parity.homeCalculated,
            awayExpected: parity.awayExpected,
            awayCalculated: parity.awayCalculated,
            errors: parity.errors,
          },
        }),
      },
    })

    return { reportId: report.id, version: newVersion }
  })

  // 5. Standings — fora da transacao (read+aggregate, idempotente)
  try {
    await recalculateStandings(game.categoryId)
  } catch (err) {
    console.error(`[closeGame] Falha ao recalcular standings de ${game.categoryId}:`, err)
    // nao propaga — Standing nao-recalculado e recuperavel via re-run manual
  }

  return {
    ok: true,
    gameId,
    fromState,
    newState,
    versionCreated: txResult.version,
    reportId: txResult.reportId,
    parityErrors: parity.ok ? [] : parity.errors,
    warnings: parity.ok ? [] : ['Fechado com erros de paridade (forced via allowParityErrors).'],
  }
}

// ─────────────── requestReview ───────────────

export async function requestReview(
  input: RequestReviewInput,
): Promise<{ ok: boolean; fromState: GameLifecycleState; newState: GameLifecycleState }> {
  const { gameId, reason, actorUserId } = input

  if (!reason || reason.trim().length < 3) {
    throw new Error('Motivo de revisao e obrigatorio (min. 3 caracteres)')
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { lifecycleState: true },
  })
  if (!game) throw new Error(`Jogo ${gameId} nao encontrado`)

  const fromState = (game.lifecycleState ?? 'SCHEDULED') as GameLifecycleState
  assertCanTransition(fromState, 'UNDER_REVIEW')

  await prisma.$transaction(async (tx) => {
    await tx.game.update({
      where: { id: gameId },
      data: {
        lifecycleState: 'UNDER_REVIEW',
        lifecycleVersion: { increment: 1 },
      },
    })

    await tx.gameAuditLog.create({
      data: {
        gameId,
        actionType: 'REVIEW_REQUESTED',
        actorUserId: actorUserId ?? null,
        targetEntity: 'Game',
        targetEntityId: gameId,
        description: `Revisao solicitada: ${reason}`,
        metaJson: JSON.stringify({ from: fromState, to: 'UNDER_REVIEW', reason }),
      },
    })
  })

  return { ok: true, fromState, newState: 'UNDER_REVIEW' }
}

// ─────────────── publishGame ───────────────

/**
 * Publica jogo confirmado: CONFIRMED -> PUBLISHED.
 * Torna o jogo visivel publicamente e marca como imutavel.
 */
export async function publishGame(input: {
  gameId: string
  actorUserId?: string
}): Promise<{ ok: boolean; fromState: GameLifecycleState; newState: GameLifecycleState }> {
  const { gameId, actorUserId } = input

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { lifecycleState: true },
  })
  if (!game) throw new Error(`Jogo ${gameId} nao encontrado`)

  const fromState = (game.lifecycleState ?? 'SCHEDULED') as GameLifecycleState
  assertCanTransition(fromState, 'PUBLISHED')

  await prisma.$transaction(async (tx) => {
    await tx.game.update({
      where: { id: gameId },
      data: {
        lifecycleState: 'PUBLISHED',
        lifecycleVersion: { increment: 1 },
        isLivePublished: true,
      },
    })

    await tx.gameAuditLog.create({
      data: {
        gameId,
        actionType: 'GAME_PUBLISHED',
        actorUserId: actorUserId ?? null,
        targetEntity: 'Game',
        targetEntityId: gameId,
        description: `Jogo publicado: ${fromState} -> PUBLISHED`,
        metaJson: JSON.stringify({ from: fromState, to: 'PUBLISHED' }),
      },
    })
  })

  return { ok: true, fromState, newState: 'PUBLISHED' }
}

// ─────────────── readGameLifecycle ───────────────

/**
 * Le o estado atual + historico de versoes + audit log recente.
 * Util pra UI de "Status do Jogo".
 */
export async function readGameLifecycle(gameId: string) {
  const [game, report, versions, recentAudit] = await Promise.all([
    prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        lifecycleState: true,
        lifecycleVersion: true,
        status: true,
        liveStatus: true,
        homeScore: true,
        awayScore: true,
        isLivePublished: true,
      },
    }),
    prisma.gameOfficialReport.findUnique({
      where: { gameId },
      select: {
        id: true,
        currentVersion: true,
        finalizedAt: true,
        signedOffByUserId: true,
      },
    }),
    prisma.gameOfficialReportVersion.findMany({
      where: { report: { gameId } },
      orderBy: { version: 'desc' },
      take: 10,
      select: {
        version: true,
        finalHomeScore: true,
        finalAwayScore: true,
        finalizedAt: true,
        reason: true,
        createdAt: true,
        createdByUserId: true,
      },
    }),
    prisma.gameAuditLog.findMany({
      where: { gameId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  if (!game) return null

  return {
    game,
    report,
    versions,
    recentAudit,
  }
}
