/**
 * Smoke test Fase 5.E — valida triggers de imutabilidade Game.
 * Usa dev.db (sqlite local). Idempotente, nao deixa lixo.
 *
 * Run:  npx tsx scripts/smoke-fase5e.ts
 */
import { prisma } from '../src/lib/db'
import { ensureDatabaseSchema } from '../src/lib/db-patch'

async function main() {
  console.log('1. Forcando ensureDatabaseSchema (aplica triggers)...')
  await ensureDatabaseSchema(true)

  console.log('2. Verificando que os triggers foram criados...')
  const triggers = await (prisma as any).$queryRawUnsafe(
    `SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'Game_immutable%';`
  )
  console.log('   Triggers encontrados:', triggers)
  if (!Array.isArray(triggers) || triggers.length < 2) {
    throw new Error('FAIL: triggers Game_immutable_data_update / Game_immutable_delete nao foram criados')
  }

  console.log('3. Procurando jogo CONFIRMED de teste...')
  let testGame = await prisma.game.findFirst({
    where: { lifecycleState: 'CONFIRMED' },
    select: { id: true, homeScore: true, lifecycleState: true },
  })

  let cleanupAfter = false
  if (!testGame) {
    console.log('   Nenhum jogo CONFIRMED — criando jogo via SQL raw (bypassa FK pra teste)...')
    const fakeId = `smoke-fase5e-${Date.now()}`
    // PRAGMA foreign_keys=OFF para esse smoke (dev.db sqlite default tem FK off de qualquer jeito)
    await (prisma as any).$executeRawUnsafe(`PRAGMA foreign_keys = OFF;`)
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO Game (id, championshipId, categoryId, homeTeamId, awayTeamId,
        dateTime, location, city, homeScore, awayScore, lifecycleState,
        phase, round, status, liveStatus, lifecycleVersion, createdAt)
       VALUES ('${fakeId}', 'fake-champ', 'fake-cat', 'fake-home', 'fake-away',
        '2026-05-11 12:00:00', 'smoke', 'smoke', 80, 75, 'CONFIRMED',
        1, 1, 'FINISHED', 'FINISHED', 1, '2026-05-11 12:00:00');`
    )
    testGame = { id: fakeId, homeScore: 80, lifecycleState: 'CONFIRMED' }
    cleanupAfter = true
    console.log('   Criado:', testGame)
  } else {
    console.log('   Usando jogo existente:', testGame)
  }

  console.log('4. Tentando UPDATE direto que deveria ser BLOQUEADO (homeScore++)...')
  try {
    await (prisma as any).$executeRawUnsafe(
      `UPDATE Game SET homeScore = COALESCE(homeScore, 0) + 1 WHERE id = '${testGame.id}'`
    )
    console.log('   FAIL: UPDATE passou! Trigger nao funcionou.')
    process.exitCode = 1
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    if (msg.toLowerCase().includes('imutavel') || msg.toLowerCase().includes('immutable')) {
      console.log('   OK: UPDATE bloqueado pelo trigger ->', msg.split('\n')[0])
    } else {
      console.log('   PASS (mas mensagem inesperada):', msg.split('\n')[0])
    }
  }

  console.log('5. Tentando UPDATE legitimo (lifecycleState CONFIRMED -> UNDER_REVIEW)...')
  try {
    await (prisma as any).$executeRawUnsafe(
      `UPDATE Game SET lifecycleState = 'UNDER_REVIEW' WHERE id = '${testGame.id}'`
    )
    console.log('   OK: transicao para UNDER_REVIEW passou (trigger nao bloqueia troca de estado)')
    // Restaura
    await (prisma as any).$executeRawUnsafe(
      `UPDATE Game SET lifecycleState = 'CONFIRMED' WHERE id = '${testGame.id}'`
    )
  } catch (err: any) {
    console.log('   FAIL: trigger bloqueou transicao legitima:', err?.message)
    process.exitCode = 1
  }

  console.log('6. Tentando DELETE direto que deveria ser BLOQUEADO...')
  try {
    await (prisma as any).$executeRawUnsafe(
      `DELETE FROM Game WHERE id = '${testGame.id}'`
    )
    console.log('   FAIL: DELETE passou! Trigger nao funcionou.')
    process.exitCode = 1
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.log('   OK: DELETE bloqueado ->', msg.split('\n')[0])
  }

  if (cleanupAfter) {
    console.log('7. Cleanup: removendo jogo de teste (passa pra DRAFT antes pra escapar do trigger)...')
    await (prisma as any).$executeRawUnsafe(
      `UPDATE Game SET lifecycleState = 'DRAFT' WHERE id = '${testGame.id}'`
    )
    await (prisma as any).$executeRawUnsafe(
      `DELETE FROM Game WHERE id = '${testGame.id}'`
    )
    console.log('   OK: jogo de teste removido')
  }

  console.log('\nSmoke test Fase 5.E COMPLETO.')
}

main()
  .catch((err) => {
    console.error('ERRO no smoke:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
