/**
 * Smoke PM-02 Task 4 — valida math de capacidade do pre-validate.ts.
 *
 * Pure-logic (sem DB). Replica as formulas-chave inline e exercita
 * cenarios conhecidos de validDays / slotsPerDay / capacityPercent.
 *
 * Run: npx tsx scripts/smoke-pm02-task4.ts
 */
import {
  getSchedulingConfig,
  isWeekdayAllowed,
  isDateInBlackout,
  parseMinutesFromTime,
} from '../src/lib/championship/scheduling-config'

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

function countValidDays(
  startISO: string,
  endISO: string,
  config: ReturnType<typeof getSchedulingConfig>,
): number {
  let n = 0
  const cursor = new Date(startISO)
  cursor.setUTCHours(12, 0, 0, 0)
  const endDay = new Date(endISO)
  endDay.setUTCHours(12, 0, 0, 0)
  while (cursor.getTime() <= endDay.getTime()) {
    if (isWeekdayAllowed(cursor, config) && !isDateInBlackout(cursor, config)) {
      n++
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return n
}

function slotsPerDayOf(config: ReturnType<typeof getSchedulingConfig>): number {
  return config.timeSlots.length > 0
    ? config.timeSlots.length
    : Math.max(
        0,
        Math.floor(
          (parseMinutesFromTime(config.regularDayEndTime) -
            parseMinutesFromTime(config.dayStartTime)) /
            Math.max(1, config.slotDurationMinutes),
        ),
      )
}

function severityFor(capacityPercent: number, slotsAvailable: number, gamesNeeded: number) {
  if (slotsAvailable === 0 && gamesNeeded > 0) return 'ERROR'
  if (capacityPercent > 100) return 'ERROR'
  if (capacityPercent > 85) return 'WARNING'
  return 'OK'
}

// ─── 1. validDays: maio/2026 (01-31) com allowedWeekdays=[6] (so sab) ───
console.log('1. validDays — allowedWeekdays=[6] em maio/2026')
{
  const config = getSchedulingConfig({
    allowedWeekdaysJson: '[6]',
    blackoutDatesJson: '[]',
  })
  // 2026-05: sabados sao 02, 09, 16, 23, 30 -> 5
  assertEq('5 sabados em maio/2026', countValidDays('2026-05-01', '2026-05-31', config), 5)
}

// ─── 2. validDays subtraindo blackoutDates ───
console.log('\n2. validDays — blackoutDates remove sabados')
{
  const config = getSchedulingConfig({
    allowedWeekdaysJson: '[6]',
    blackoutDatesJson: '[{"date":"2026-05-16"},{"date":"2026-05-23"}]',
  })
  // 5 sabados - 2 bloqueados = 3
  assertEq('3 sabados validos apos 2 blackouts', countValidDays('2026-05-01', '2026-05-31', config), 3)
}

// ─── 3. slotsPerDay com timeSlots customizados ───
console.log('\n3. slotsPerDay — timeSlots customizados')
{
  const config = getSchedulingConfig({
    timeSlotsJson: '[{"start":"08:00","end":"09:30"},{"start":"10:00","end":"11:30"},{"start":"14:00","end":"15:30"}]',
  })
  assertEq('3 slots custom', slotsPerDayOf(config), 3)
}

// ─── 4. slotsPerDay fallback dinamico ───
console.log('\n4. slotsPerDay — fallback de dayStartTime->regularDayEndTime')
{
  const config = getSchedulingConfig({
    timeSlotsJson: '[]',
    dayStartTime: '08:00',
    regularDayEndTime: '19:00',
    slotDurationMinutes: 75,
  })
  // (19*60 - 8*60) / 75 = 660/75 = 8.8 -> floor = 8
  assertEq('8 slots em 11h com 75min cada', slotsPerDayOf(config), 8)
}

// ─── 5. capacityPercent severity classification ───
console.log('\n5. severityFor — classificacao por % capacidade')
assertEq('60/100 -> OK (60%)', severityFor(60, 100, 60), 'OK')
assertEq('85/100 -> OK (boundary, 85%)', severityFor(85, 100, 85), 'OK')
assertEq('90/100 -> WARNING (90%)', severityFor(90, 100, 90), 'WARNING')
assertEq('100/100 -> WARNING (boundary, 100%)', severityFor(100, 100, 100), 'WARNING')
assertEq('110/100 -> ERROR (over)', severityFor(110, 100, 110), 'ERROR')
assertEq('0 slots / 5 games -> ERROR', severityFor(100, 0, 5), 'ERROR')
assertEq('0 slots / 0 games -> OK', severityFor(0, 0, 0), 'OK')

// ─── 6. ciclo completo: criar config, validar capacidade num cenario realista ───
console.log('\n6. Cenario realista — campeonato de 4 equipes 1 categoria, 5 sab, 8 slots/dia')
{
  const config = getSchedulingConfig({
    allowedWeekdaysJson: '[6]',
    timeSlotsJson: '[]',
    dayStartTime: '08:00',
    regularDayEndTime: '19:00',
    slotDurationMinutes: 75,
    numberOfCourts: 1,
  })
  const validDays = countValidDays('2026-05-01', '2026-05-31', config)
  const slots = slotsPerDayOf(config)
  const totalSlotsAvailable = validDays * slots * 1
  // 4 equipes, 1 turno, round-robin: (4*3/2)*1 = 6 jogos
  const totalGamesNeeded = 6
  const capacityPercent = totalSlotsAvailable === 0
    ? (totalGamesNeeded > 0 ? 100 : 0)
    : Math.round((totalGamesNeeded / totalSlotsAvailable) * 100)
  assertEq('validDays', validDays, 5)
  assertEq('slotsPerDay', slots, 8)
  assertEq('totalSlotsAvailable', totalSlotsAvailable, 40)
  assertEq('capacityPercent', capacityPercent, 15) // 6/40 = 0.15
  assertEq('severity', severityFor(capacityPercent, totalSlotsAvailable, totalGamesNeeded), 'OK')
}

if (failures > 0) {
  console.log(`\n${failures} FAILURE(S).`)
  process.exitCode = 1
} else {
  console.log('\nAll asserts OK.')
}
