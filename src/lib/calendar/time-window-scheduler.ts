import { addDays, format, isFriday, isSaturday, isSunday, nextSaturday, startOfDay } from 'date-fns'
import { generateSlotTimes, type BlockFormat } from '../championship/time-window'

export interface GameToSchedule {
  id?: string
  categoryId: string
  homeTeamId: string
  awayTeamId: string
  round: number
  [key: string]: any
}

interface SchedulerConfig {
  numberOfCourts: number
  dayStartTime: string
  regularDayEndTime: string
  extendedDayEndTime: string
  slotDurationMinutes: number
  minRestSlotsPerTeam: number
  blockFormat: BlockFormat
  startWeekend: Date
}

export interface ScheduledGame extends GameToSchedule {
  date: string
  time: string
  court: string
  dateTime: Date
}

/**
 * Agendador tipo "Sala de Reunião"
 * Preenche slots da esquerda para a direita, respeitando quadras e descanso.
 */
export function scheduleGamesByTimeWindow(
  games: GameToSchedule[],
  config: SchedulerConfig
): ScheduledGame[] {
  const {
    numberOfCourts,
    dayStartTime,
    regularDayEndTime,
    extendedDayEndTime,
    slotDurationMinutes,
    minRestSlotsPerTeam,
    blockFormat,
    startWeekend,
  } = config

  const result: ScheduledGame[] = []
  
  // 1. Preparar fila de jogos (ordenar por rodada para manter ordem cronológica lógica)
  const queue = [...games].sort((a, b) => (a.round || 0) - (b.round || 0))

  // 2. Controladores de estado do agendador
  let currentWeekendStart = startOfDay(startWeekend)
  // Garantir que comece em um fim de semana válido
  while (!isValidStartDay(currentWeekendStart, blockFormat)) {
    currentWeekendStart = addDays(currentWeekendStart, 1)
  }

  // Mapa para controlar último slot ocupado por cada time (por categoria)
  // key: "teamId-categoryId-date" -> slotIndex
  const teamLastSlot = new Map<string, number>()

  // 3. Loop principal de alocação
  while (queue.length > 0) {
    const weekendDays = getWeekendDays(currentWeekendStart, blockFormat)
    
    for (const day of weekendDays) {
      if (queue.length === 0) break

      const dateStr = format(day, 'yyyy-MM-dd')
      const isSat = isSaturday(day)
      const endTime = isSat && blockFormat !== 'SAT_ONLY' ? extendedDayEndTime : regularDayEndTime
      const slots = generateSlotTimes(dayStartTime, endTime, slotDurationMinutes)
      
      // slotsCourts[slotIdx] = [court1_occupied, court2_occupied, ...]
      const slotsCourtsStatus = slots.map(() => new Array(numberOfCourts).fill(false))

      // Tentar encaixar o máximo de jogos hoje
      for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
        for (let courtIdx = 0; courtIdx < numberOfCourts; courtIdx++) {
          if (queue.length === 0) break

          // Encontrar o primeiro jogo da fila que pode jogar NESTE slot (descanso)
          let gameIdx = -1
          for (let i = 0; i < queue.length; i++) {
            const game = queue[i]
            if (canTeamPlayInSlot(game, dateStr, slotIdx, teamLastSlot, minRestSlotsPerTeam)) {
              gameIdx = i
              break
            }
          }

          if (gameIdx !== -1) {
            const game = queue.splice(gameIdx, 1)[0]
            const time = slots[slotIdx]
            
            // Marcar ocupação do time
            markTeamSlot(game.homeTeamId, game.categoryId, dateStr, slotIdx, teamLastSlot)
            markTeamSlot(game.awayTeamId, game.categoryId, dateStr, slotIdx, teamLastSlot)
            
            // Criar data/hora real para o Prisma
            const [h, m] = time.split(':').map(Number)
            const dateTime = new Date(day)
            dateTime.setHours(h, m, 0, 0)

            result.push({
              ...game,
              date: dateStr,
              time,
              court: numberOfCourts > 1 ? `Quadra ${String.fromCharCode(65 + courtIdx)}` : 'Quadra Única',
              dateTime
            })

            slotsCourtsStatus[slotIdx][courtIdx] = true
          }
        }
      }
    }

    // Se ainda houver jogos, pula para o próximo sábado (7 dias depois)
    if (queue.length > 0) {
      currentWeekendStart = nextSaturday(currentWeekendStart)
      // Ajustar se o formato for FRI_SAT_SUN para pegar a sexta do bloco
      if (blockFormat === 'FRI_SAT_SUN') {
        currentWeekendStart = addDays(currentWeekendStart, -1)
      }
    }
  }

  return result
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidStartDay(date: Date, format: BlockFormat): boolean {
  if (format === 'FRI_SAT_SUN') return isFriday(date) || isSaturday(date) || isSunday(date)
  if (format === 'SAT_SUN') return isSaturday(date) || isSunday(date)
  return isSaturday(date)
}

function getWeekendDays(start: Date, block: BlockFormat): Date[] {
  const days: Date[] = []
  if (block === 'FRI_SAT_SUN') {
    // Se for sexta, pega Sex, Sab, Dom
    if (isFriday(start)) {
      days.push(start, addDays(start, 1), addDays(start, 2))
    } else {
      days.push(start) // Caso caia no meio, apenas processa o dia
    }
  } else if (block === 'SAT_SUN') {
    if (isSaturday(start)) {
      days.push(start, addDays(start, 1))
    } else {
      days.push(start)
    }
  } else {
    days.push(start)
  }
  return days
}

function canTeamPlayInSlot(
  game: GameToSchedule,
  date: string,
  slotIdx: number,
  lastSlots: Map<string, number>,
  minRest: number
): boolean {
  const teams = [game.homeTeamId, game.awayTeamId]
  for (const tId of teams) {
    const key = `${tId}-${game.categoryId}-${date}`
    const lastIdx = lastSlots.get(key)
    if (lastIdx !== undefined) {
      // Se já jogou hoje, precisa de (1 + minRest) slots de distância
      // Ex: minRest = 1 -> joga no 0, pode jogar no 2 (idx 0 + 1 + 1 = 2)
      if (slotIdx < lastIdx + minRest + 1) return false
    }
  }
  return true
}

function markTeamSlot(
  teamId: string,
  categoryId: string,
  date: string,
  slotIdx: number,
  lastSlots: Map<string, number>
) {
  const key = `${teamId}-${categoryId}-${date}`
  lastSlots.set(key, slotIdx)
}
