import type { Athlete } from '@prisma/client'

export type MissingFieldKey =
  | 'name'
  | 'birthDate'
  | 'nationality'
  | 'sex'
  | 'maritalStatus'
  | 'education'
  | 'cpf'
  | 'rg'
  | 'rgOrgan'
  | 'rgDate'
  | 'parentContact'
  | 'mobile'
  | 'filiation'
  | 'cep'
  | 'state'
  | 'city'
  | 'photoUrl'
  | 'docCPF'
  | 'docRG'
  | 'teamId'

export interface AthleteAuditResult {
  athleteId: string
  registrationNumber: number | null
  name: string
  teamId: string | null
  teamName: string | null
  situation: string | null
  birthDate: Date | null
  age: number | null
  isMinor: boolean
  isComplete: boolean
  missingFields: MissingFieldKey[]
  totalProblems: number
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

function calculateAge(birthDate: Date | null): number | null {
  if (!birthDate) return null
  const now = new Date()
  const diff = now.getTime() - birthDate.getTime()
  const years = diff / (1000 * 60 * 60 * 24 * 365.25)
  return Math.floor(years)
}

export function auditAthlete(
  athlete: Athlete & { team?: { id: string; name: string } | null }
): AthleteAuditResult {
  const missing: MissingFieldKey[] = []
  const age = calculateAge(athlete.birthDate)
  const isMinor = age !== null && age < 18

  // Identificação
  if (isEmpty(athlete.name)) missing.push('name')
  if (isEmpty(athlete.birthDate)) missing.push('birthDate')
  if (isEmpty(athlete.nationality)) missing.push('nationality')
  if (isEmpty(athlete.sex)) missing.push('sex')
  if (isEmpty(athlete.maritalStatus)) missing.push('maritalStatus')
  if (isEmpty(athlete.education)) missing.push('education')

  // Documentos texto
  if (isEmpty(athlete.cpf)) missing.push('cpf')
  if (isEmpty(athlete.rg)) missing.push('rg')
  if (isEmpty(athlete.rgOrgan)) missing.push('rgOrgan')
  if (isEmpty(athlete.rgDate)) missing.push('rgDate')

  // Contato (depende da idade)
  if (age === null) {
    // sem birthDate, não conseguimos decidir — exige mobile como fallback
    if (isEmpty(athlete.mobile)) missing.push('mobile')
  } else if (isMinor) {
    if (isEmpty(athlete.parentContactPhone) || isEmpty(athlete.parentContactRole)) {
      missing.push('parentContact')
    }
  } else {
    if (isEmpty(athlete.mobile)) missing.push('mobile')
  }

  // Filiação (pelo menos um)
  if (isEmpty(athlete.motherName) && isEmpty(athlete.fatherName)) {
    missing.push('filiation')
  }

  // Endereço
  if (isEmpty(athlete.cep)) missing.push('cep')
  if (isEmpty(athlete.state)) missing.push('state')
  if (isEmpty(athlete.city)) missing.push('city')

  // Uploads
  if (isEmpty(athlete.photoUrl)) missing.push('photoUrl')

  // CPF digital: (front E back) OU legacy
  const hasCpfModern = !isEmpty(athlete.docCPFFrontUrl) && !isEmpty(athlete.docCPFBackUrl)
  const hasCpfLegacy = !isEmpty(athlete.docCPFUrl)
  if (!hasCpfModern && !hasCpfLegacy) missing.push('docCPF')

  // RG digital: front E back
  if (isEmpty(athlete.docRGFrontUrl) || isEmpty(athlete.docRGBackUrl)) {
    missing.push('docRG')
  }

  // Vínculo
  if (isEmpty(athlete.teamId)) missing.push('teamId')

  return {
    athleteId: athlete.id,
    registrationNumber: athlete.registrationNumber,
    name: athlete.name,
    teamId: athlete.teamId,
    teamName: athlete.team?.name ?? null,
    situation: athlete.situation,
    birthDate: athlete.birthDate,
    age,
    isMinor,
    isComplete: missing.length === 0,
    missingFields: missing,
    totalProblems: missing.length,
  }
}

// Labels human-readable pra exibir na UI / CSV
export const MISSING_FIELD_LABELS: Record<MissingFieldKey, string> = {
  name: 'Nome',
  birthDate: 'Data de nascimento',
  nationality: 'Nacionalidade',
  sex: 'Sexo',
  maritalStatus: 'Estado civil',
  education: 'Escolaridade',
  cpf: 'CPF',
  rg: 'RG',
  rgOrgan: 'Órgão expedidor RG',
  rgDate: 'Data emissão RG',
  parentContact: 'Contato do responsável',
  mobile: 'Celular',
  filiation: 'Filiação (mãe/pai)',
  cep: 'CEP',
  state: 'Estado',
  city: 'Cidade',
  photoUrl: 'Foto 3x4',
  docCPF: 'CPF digitalizado',
  docRG: 'RG digitalizado',
  teamId: 'Vínculo com clube',
}
