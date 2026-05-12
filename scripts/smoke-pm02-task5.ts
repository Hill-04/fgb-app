/**
 * Smoke PM-02 Task 5 — valida regras de aceitacao de moves do aiOptimizer.
 *
 * Pure-logic (sem API call). Replica as helpers internas e exercita filtros:
 * - gameId desconhecido
 * - weekday fora do allowed
 * - data em blackout
 * - formato de data/hora invalido
 *
 * Run: npx tsx scripts/smoke-pm02-task5.ts
 */

let failures = 0
function assertEq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  console.log(`   ${ok ? 'OK ' : 'FAIL'} ${name}`)
  if (!ok) {
    console.log('      got: ', got)
    console.log('      want:', want)
    failures += 1
  }
}

function isWithinAllowedDay(dateISO: string, allowedWeekdays: number[]): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return false
  const d = new Date(`${dateISO}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return false
  return allowedWeekdays.includes(d.getUTCDay())
}

function isInBlackout(dateISO: string, blackouts: { date: string }[]): boolean {
  return blackouts.some(b => b.date === dateISO)
}

type Move = { gameId: string; newDate: string; newTime: string; reason: string }
type FilterCtx = {
  validGameIds: Set<string>
  allowedWeekdays: number[]
  blackoutDates: { date: string }[]
}

function filterMove(m: Move, ctx: FilterCtx): { ok: boolean; reason?: string } {
  if (!ctx.validGameIds.has(m.gameId)) return { ok: false, reason: `gameId ${m.gameId} desconhecido` }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.newDate)) return { ok: false, reason: `newDate invalida: ${m.newDate}` }
  if (!/^\d{2}:\d{2}$/.test(m.newTime)) return { ok: false, reason: `newTime invalido: ${m.newTime}` }
  if (!isWithinAllowedDay(m.newDate, ctx.allowedWeekdays)) {
    return { ok: false, reason: `${m.newDate} fora de allowedWeekdays` }
  }
  if (isInBlackout(m.newDate, ctx.blackoutDates)) {
    return { ok: false, reason: `${m.newDate} esta em blackoutDates` }
  }
  return { ok: true }
}

// ─── 1. isWithinAllowedDay ───
console.log('1. isWithinAllowedDay')
assertEq('2026-05-09 (sab) com [6] -> true', isWithinAllowedDay('2026-05-09', [6]), true)
assertEq('2026-05-10 (dom) com [6] -> false', isWithinAllowedDay('2026-05-10', [6]), false)
assertEq('2026-05-09 (sab) com [5,6] -> true', isWithinAllowedDay('2026-05-09', [5, 6]), true)
assertEq('formato invalido -> false', isWithinAllowedDay('09-05-2026', [6]), false)
assertEq('data invalida -> false', isWithinAllowedDay('2026-13-99', [6]), false)

// ─── 2. isInBlackout ───
console.log('\n2. isInBlackout')
assertEq('match exato -> true', isInBlackout('2026-06-15', [{ date: '2026-06-15' }]), true)
assertEq('sem match -> false', isInBlackout('2026-06-16', [{ date: '2026-06-15' }]), false)
assertEq('blackouts vazio -> false', isInBlackout('2026-06-15', []), false)

// ─── 3. filterMove ───
console.log('\n3. filterMove — filtros do aiOptimizer')
const ctx: FilterCtx = {
  validGameIds: new Set(['g0', 'g1', 'g2']),
  allowedWeekdays: [6, 0],
  blackoutDates: [{ date: '2026-05-17' }],
}

assertEq(
  'move valido (sab + gameId conhecido + sem blackout)',
  filterMove({ gameId: 'g1', newDate: '2026-05-09', newTime: '10:00', reason: 'r' }, ctx).ok,
  true,
)
assertEq(
  'gameId desconhecido -> rejeita',
  filterMove({ gameId: 'gZ', newDate: '2026-05-09', newTime: '10:00', reason: 'r' }, ctx).ok,
  false,
)
assertEq(
  'weekday nao permitido (segunda) -> rejeita',
  filterMove({ gameId: 'g0', newDate: '2026-05-11', newTime: '10:00', reason: 'r' }, ctx).ok,
  false,
)
assertEq(
  'data em blackout -> rejeita',
  filterMove({ gameId: 'g0', newDate: '2026-05-17', newTime: '10:00', reason: 'r' }, ctx).ok,
  false,
)
assertEq(
  'newDate formato errado -> rejeita',
  filterMove({ gameId: 'g0', newDate: '09/05/2026', newTime: '10:00', reason: 'r' }, ctx).ok,
  false,
)
assertEq(
  'newTime formato errado -> rejeita',
  filterMove({ gameId: 'g0', newDate: '2026-05-09', newTime: '10h', reason: 'r' }, ctx).ok,
  false,
)

// ─── 4. lote misturado ───
console.log('\n4. Lote com 5 moves (3 validos + 2 invalidos)')
const moves: Move[] = [
  { gameId: 'g0', newDate: '2026-05-09', newTime: '10:00', reason: 'r1' },  // ok
  { gameId: 'g1', newDate: '2026-05-10', newTime: '15:00', reason: 'r2' },  // ok (dom)
  { gameId: 'gZ', newDate: '2026-05-09', newTime: '10:00', reason: 'r3' },  // rej
  { gameId: 'g2', newDate: '2026-05-17', newTime: '10:00', reason: 'r4' },  // rej (blackout)
  { gameId: 'g0', newDate: '2026-05-16', newTime: '10:00', reason: 'r5' },  // ok (sab)
]
const passed = moves.filter(m => filterMove(m, ctx).ok)
const rejected = moves.filter(m => !filterMove(m, ctx).ok)
assertEq('3 passaram', passed.length, 3)
assertEq('2 rejeitados', rejected.length, 2)
assertEq('rejected gameIds', rejected.map(m => m.gameId), ['gZ', 'g2'])

if (failures > 0) {
  console.log(`\n${failures} FAILURE(S).`)
  process.exitCode = 1
} else {
  console.log('\nAll asserts OK.')
}
