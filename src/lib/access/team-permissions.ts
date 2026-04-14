export type TeamPortalRole =
  | 'HEAD_COACH'
  | 'ASSISTANT_COACH'
  | 'PHYSICAL_TRAINER'
  | 'DOCTOR'
  | 'STAFF_OTHER'
  | 'ADMIN'
  | null
  | undefined

export function canManageTeamMembers(teamRole: TeamPortalRole) {
  return teamRole === 'HEAD_COACH' || teamRole === 'ADMIN'
}

export function canEditTeamCriticalData(teamRole: TeamPortalRole) {
  return teamRole === 'HEAD_COACH' || teamRole === 'ADMIN'
}

export function canCreateChampionshipRegistrations(teamRole: TeamPortalRole) {
  return teamRole === 'HEAD_COACH' || teamRole === 'ADMIN'
}
