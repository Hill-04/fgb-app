export type BlockFormat = 'SAT_SUN' | 'FRI_SAT_SUN' | 'SAT_ONLY'

export interface TimeWindowConfig {
  dayStartTime: string          // 'HH:MM' — default '08:00'
  regularDayEndTime: string     // 'HH:MM' — default '19:00' (Sex e Dom)
  extendedDayEndTime: string    // 'HH:MM' — default '20:30' (Sáb)
  slotDurationMinutes: number   // default 75
  minRestSlotsPerTeam: number   // default 1 (mesmo time precisa de 1 slot livre)
  blockFormat: BlockFormat      // default 'SAT_SUN'
}

export interface TimeWindowValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  regularDaySlots: number
  extendedDaySlots: number
  regularDaySlotTimes: string[]
  extendedDaySlotTimes: string[]
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function generateSlotTimes(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number
): string[] {
  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  const slots: string[] = []

  let current = startMin
  while (current <= endMin) {
    slots.push(minutesToTime(current))
    current += slotDurationMinutes
  }

  return slots
}

const VALID_BLOCK_FORMATS: BlockFormat[] = ['SAT_SUN', 'FRI_SAT_SUN', 'SAT_ONLY']

export function validateTimeWindowConfig(
  input: Partial<TimeWindowConfig>
): TimeWindowValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const config: TimeWindowConfig = {
    dayStartTime:         input.dayStartTime         ?? '08:00',
    regularDayEndTime:    input.regularDayEndTime    ?? '19:00',
    extendedDayEndTime:   input.extendedDayEndTime   ?? '20:30',
    slotDurationMinutes:  input.slotDurationMinutes  ?? 75,
    minRestSlotsPerTeam:  input.minRestSlotsPerTeam  ?? 1,
    blockFormat:          (input.blockFormat as BlockFormat) ?? 'SAT_SUN',
  }

  const startMin   = timeToMinutes(config.dayStartTime)
  const regularMin = timeToMinutes(config.regularDayEndTime)
  const extended   = timeToMinutes(config.extendedDayEndTime)

  if (regularMin <= startMin) {
    errors.push('Horário de término deve ser posterior ao de início.')
  }

  if (extended < regularMin) {
    errors.push('Horário estendido (sábado) deve ser igual ou posterior ao horário regular.')
  }

  if (!VALID_BLOCK_FORMATS.includes(config.blockFormat as BlockFormat)) {
    errors.push(`Formato de bloco inválido: ${config.blockFormat}. Use SAT_SUN, FRI_SAT_SUN ou SAT_ONLY.`)
  }

  if (config.slotDurationMinutes < 60) {
    warnings.push('Slots menores que 60 min podem ser insuficientes para jogos de basquete juvenil (aquecimento + jogo).')
  }

  const regularSlotTimes  = generateSlotTimes(config.dayStartTime, config.regularDayEndTime, config.slotDurationMinutes)
  const extendedSlotTimes = generateSlotTimes(config.dayStartTime, config.extendedDayEndTime, config.slotDurationMinutes)

  if (regularSlotTimes.length < 3) {
    warnings.push(`Janela regular gera apenas ${regularSlotTimes.length} slot(s) por dia — considere ampliar o horário.`)
  }

  return {
    valid:                  errors.length === 0,
    errors,
    warnings,
    regularDaySlots:        regularSlotTimes.length,
    extendedDaySlots:       extendedSlotTimes.length,
    regularDaySlotTimes:    regularSlotTimes,
    extendedDaySlotTimes:   extendedSlotTimes,
  }
}
