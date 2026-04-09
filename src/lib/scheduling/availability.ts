export type TeamBlockedRange = {
  startDate: Date
  endDate: Date
  affectsAllCats?: boolean
  reason?: string | null
}

export function normalizeUtcDayStart(date: Date) {
  const normalized = new Date(date)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

export function normalizeUtcDayEnd(date: Date) {
  const normalized = new Date(date)
  normalized.setUTCHours(23, 59, 59, 999)
  return normalized
}

export function isDateBlockedByRanges(date: Date, blocks: TeamBlockedRange[]) {
  const target = normalizeUtcDayStart(date)

  return blocks.some((block) => {
    const start = normalizeUtcDayStart(new Date(block.startDate))
    const end = normalizeUtcDayEnd(new Date(block.endDate))
    return target >= start && target <= end
  })
}

export function isDateBlockedForTeam(
  date: Date,
  teamId: string,
  blockedMap: Map<string, TeamBlockedRange[]>
) {
  return isDateBlockedByRanges(date, blockedMap.get(teamId) || [])
}

export function buildBlockedMap(
  registrations: Array<{
    teamId: string
    blockedDates?: Array<{
      startDate: Date | string
      endDate: Date | string
      affectsAllCats?: boolean
      reason?: string | null
    }>
  }>
) {
  const blockedMap = new Map<string, TeamBlockedRange[]>()

  for (const registration of registrations) {
    blockedMap.set(
      registration.teamId,
      (registration.blockedDates || []).map((blockedDate) => ({
        startDate: new Date(blockedDate.startDate),
        endDate: new Date(blockedDate.endDate),
        affectsAllCats: blockedDate.affectsAllCats ?? false,
        reason: blockedDate.reason ?? null,
      }))
    )
  }

  return blockedMap
}
