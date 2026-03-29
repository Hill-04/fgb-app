import { describe, it, expect } from 'vitest'
import { validateTimeWindowConfig } from '../../lib/championship/time-window'

describe('validateTimeWindowConfig', () => {
  it('aceita configuração padrão válida', () => {
    const config = {
      dayStartTime: '08:00',
      regularDayEndTime: '19:00',
      extendedDayEndTime: '20:30',
      slotDurationMinutes: 75,
      minRestSlotsPerTeam: 1,
      blockFormat: 'SAT_SUN' as const,
    }
    const result = validateTimeWindowConfig(config)
    expect(result.valid).toBe(true)
    expect(result.regularDaySlots).toBe(9)   // 08:00→19:00 com slots de 75min
    expect(result.extendedDaySlots).toBe(11) // 08:00→20:30 com slots de 75min
  })

  it('calcula slots corretamente para janela regular', () => {
    const config = {
      dayStartTime: '08:00',
      regularDayEndTime: '19:00',
      slotDurationMinutes: 75,
    }
    const result = validateTimeWindowConfig(config)
    // 08:00, 09:15, 10:30, 11:45, 13:00, 14:15, 15:30, 16:45, 18:00 = 9 slots
    expect(result.regularDaySlots).toBe(9)
    expect(result.regularDaySlotTimes).toEqual([
      '08:00', '09:15', '10:30', '11:45', '13:00',
      '14:15', '15:30', '16:45', '18:00',
    ])
  })

  it('calcula slots corretamente para sábado estendido', () => {
    const config = {
      dayStartTime: '08:00',
      extendedDayEndTime: '20:30',
      slotDurationMinutes: 75,
    }
    const result = validateTimeWindowConfig(config)
    // +19:15 e +20:30 além dos 9 regulares = 11 slots
    expect(result.extendedDaySlots).toBe(11)
    expect(result.extendedDaySlotTimes).toContain('19:15')
    expect(result.extendedDaySlotTimes).toContain('20:30')
  })

  it('rejeita endTime anterior a startTime', () => {
    const config = {
      dayStartTime: '08:00',
      regularDayEndTime: '07:00',
      slotDurationMinutes: 75,
    }
    const result = validateTimeWindowConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Horário de término deve ser posterior ao de início.')
  })

  it('rejeita dias úteis como formato de bloco', () => {
    // blockFormat só pode ser SAT_SUN, FRI_SAT_SUN, SAT_ONLY
    const config = {
      dayStartTime: '08:00',
      regularDayEndTime: '19:00',
      slotDurationMinutes: 75,
      blockFormat: 'MON_FRI' as any,
    }
    const result = validateTimeWindowConfig(config)
    expect(result.valid).toBe(false)
  })
})
