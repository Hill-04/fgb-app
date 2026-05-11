/**
 * Backfill Fase 6.B — popula lifecycleState e timestamps em Registration existentes.
 *
 * Idempotente: pode rodar várias vezes sem efeito colateral.
 *
 * Execução:
 *   LOCAL:  DATABASE_URL=file:./dev.db npx tsx scripts/backfill-fase6.ts
 *   PROD:   DATABASE_URL=$TURSO_DATABASE_URL DATABASE_AUTH_TOKEN=$TURSO_AUTH_TOKEN \
 *           npx tsx scripts/backfill-fase6.ts
 *
 * Lógica de derivação:
 *   - status legacy 'PENDING'   → lifecycleState 'SUBMITTED' (conservador; admin não revisou ainda)
 *   - status legacy 'CONFIRMED' → lifecycleState 'CONFIRMED'  + confirmedAt = updatedAt
 *   - status legacy 'REJECTED'  → lifecycleState 'REJECTED'   + rejectedAt = updatedAt
 *   - submittedAt = registeredAt (em todos os casos, aproximação razoável)
 *
 * NÃO sobrescreve registrations que já tenham lifecycleState diferente do default 'SUBMITTED'.
 */

import { prisma } from '../src/lib/db'
import { deriveLifecycleFromLegacy } from '../src/lib/registration-lifecycle'

async function backfillLifecycleState() {
  console.log('[backfill-fase6] iniciando Registration.lifecycleState...')

  const registrations = await prisma.registration.findMany({
    select: {
      id: true,
      status: true,
      registeredAt: true,
      updatedAt: true,
      lifecycleState: true,
      submittedAt: true,
      confirmedAt: true,
      rejectedAt: true,
    },
  })

  let updated = 0
  let skipped = 0

  for (const r of registrations) {
    const derived = deriveLifecycleFromLegacy({ status: r.status })

    // Skip se já tem estado diferente do default e diferente do derivado (foi setado manualmente)
    if (r.lifecycleState && r.lifecycleState !== 'SUBMITTED' && r.lifecycleState === derived) {
      skipped++
      continue
    }

    // Skip se já tem timestamps preenchidos (já foi backfilled)
    if (r.lifecycleState === derived && (r.submittedAt || r.confirmedAt || r.rejectedAt)) {
      skipped++
      continue
    }

    const data: any = {
      lifecycleState: derived,
      submittedAt: r.submittedAt ?? r.registeredAt,
    }

    if (derived === 'CONFIRMED' && !r.confirmedAt) {
      data.confirmedAt = r.updatedAt
    }
    if (derived === 'REJECTED' && !r.rejectedAt) {
      data.rejectedAt = r.updatedAt
    }

    await prisma.registration.update({
      where: { id: r.id },
      data,
    })
    updated++
  }

  console.log(`[backfill-fase6] Registration.lifecycleState: ${updated} atualizadas, ${skipped} mantidas`)
}

async function main() {
  console.log('[backfill-fase6] iniciado em', new Date().toISOString())
  console.log('[backfill-fase6] DATABASE_URL:', (process.env.DATABASE_URL ?? '').slice(0, 30) + '…')

  try {
    await backfillLifecycleState()
    console.log('[backfill-fase6] ✓ concluído com sucesso')
  } catch (err) {
    console.error('[backfill-fase6] ✗ erro:', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
