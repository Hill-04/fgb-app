/**
 * Backfill Fase 1 — popula campos novos a partir do estado atual.
 *
 * Idempotente: pode rodar várias vezes sem efeito colateral.
 *
 * Execução:
 *   LOCAL:  DATABASE_URL=file:./dev.db npx tsx scripts/backfill-fase1.ts
 *   PROD:   DATABASE_URL=$TURSO_DATABASE_URL DATABASE_AUTH_TOKEN=$TURSO_AUTH_TOKEN \
 *           npx tsx scripts/backfill-fase1.ts
 *
 * O que faz:
 *   1. Para todo Game: deriva e popula lifecycleState a partir de status/liveStatus/isLivePublished
 *      (usa deriveLifecycleFromLegacy de src/lib/game-lifecycle.ts)
 *   2. Para todo Athlete elegível (situation='ACTIVE' AND bidNumber IS NOT NULL):
 *      marca verifiedFgb=true, verifiedFgbAt = activatedAt ?? now()
 *
 * NÃO modifica:
 *   - Eventos de jogo já existentes (não preenche correctsEventId/supersededByEventId)
 *   - Reports oficiais existentes (não cria GameOfficialReportVersion histórica)
 */

import { prisma } from '../src/lib/db'
import { deriveLifecycleFromLegacy } from '../src/lib/game-lifecycle'

async function backfillLifecycleState() {
  console.log('[backfill-fase1] iniciando Game.lifecycleState...')
  const games = await prisma.game.findMany({
    select: { id: true, status: true, liveStatus: true, isLivePublished: true, lifecycleState: true },
  })

  let updated = 0
  let skipped = 0

  for (const g of games) {
    // Se já está num estado de lifecycle não-default, assume que foi setado manualmente — não sobrescreve
    const derived = deriveLifecycleFromLegacy({
      status: g.status,
      liveStatus: g.liveStatus,
      isLivePublished: g.isLivePublished,
    })

    if (g.lifecycleState === derived) {
      skipped++
      continue
    }

    // Só sobrescreve se ainda está com default 'SCHEDULED' e o derivado é diferente,
    // OU se o derivado é mais conservador (não rebaixa CONFIRMED/PUBLISHED para SCHEDULED).
    if (g.lifecycleState !== 'SCHEDULED' && !['SCHEDULED', 'LIVE'].includes(g.lifecycleState)) {
      // estado já avançado, não toca
      skipped++
      continue
    }

    await prisma.game.update({
      where: { id: g.id },
      data: { lifecycleState: derived },
    })
    updated++
  }

  console.log(`[backfill-fase1] Game.lifecycleState: ${updated} atualizados, ${skipped} mantidos`)
}

async function backfillVerifiedFgb() {
  console.log('[backfill-fase1] iniciando Athlete.verifiedFgb...')
  // Critério: ACTIVE + tem bidNumber (BID emitido) = verificado FGB
  const eligible = await prisma.athlete.findMany({
    where: {
      situation: 'ACTIVE',
      bidNumber: { not: null },
      verifiedFgb: false,
    },
    select: { id: true, activatedAt: true },
  })

  console.log(`[backfill-fase1] ${eligible.length} atletas elegíveis para marcar verificado`)

  const now = new Date()
  let updated = 0
  for (const a of eligible) {
    await prisma.athlete.update({
      where: { id: a.id },
      data: {
        verifiedFgb: true,
        verifiedFgbAt: a.activatedAt ?? now,
        verifiedFgbBy: 'SYSTEM_BACKFILL_FASE1',
      },
    })
    updated++
  }

  console.log(`[backfill-fase1] Athlete.verifiedFgb: ${updated} marcados como verificados`)
}

async function main() {
  console.log('[backfill-fase1] iniciado em', new Date().toISOString())
  console.log('[backfill-fase1] DATABASE_URL:', (process.env.DATABASE_URL ?? '').slice(0, 30) + '…')

  try {
    await backfillLifecycleState()
    await backfillVerifiedFgb()
    console.log('[backfill-fase1] ✓ concluído com sucesso')
  } catch (err) {
    console.error('[backfill-fase1] ✗ erro:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
