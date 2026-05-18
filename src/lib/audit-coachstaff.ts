import type { CoachStaff } from '@prisma/client'

export type MissingFieldKey =
  | 'name'
  | 'role'
  | 'sex'
  | 'birthDate'
  | 'cpf'
  | 'rg'
  | 'contact'
  | 'crefi'
  | 'cep'
  | 'state'
  | 'city'
  | 'photoUrl'
  | 'teamId'

const TECHNICAL_ROLES = [
  'técnico',
  'tecnico',
  'técnico principal',
  'tecnico principal',
  'treinador',
  'head coach'
]

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

function requiresCREF(role: string | null): boolean {
  if (!role) return false
  return TECHNICAL_ROLES.includes(role.trim().toLowerCase())
}

export interface CoachStaffAuditResult {
  staffId: string
  name: string
  role: string
  teamId: string
  teamName: string | null
  situation: string
  isActive: boolean
  isTechnical: boolean
  isComplete: boolean
  missingFields: MissingFieldKey[]
  totalProblems: number
}

export function auditCoachStaff(
  staff: CoachStaff & { team?: { id: string; name: string } | null }
): CoachStaffAuditResult {
  const missing: MissingFieldKey[] = []
  const isTechnical = requiresCREF(staff.role)

  // Identificação
  if (isEmpty(staff.name)) missing.push('name')
  if (isEmpty(staff.role)) missing.push('role')
  if (isEmpty(staff.sex)) missing.push('sex')
  if (isEmpty(staff.birthDate)) missing.push('birthDate')

  // Documentos
  if (isEmpty(staff.cpf)) missing.push('cpf')
  if (isEmpty(staff.rg)) missing.push('rg')

  // Contato (mobile OR phone)
  if (isEmpty(staff.mobile) && isEmpty(staff.phone)) {
    missing.push('contact')
  }

  // CREF (condicional ao role)
  if (isTechnical && isEmpty(staff.crefi)) {
    missing.push('crefi')
  }

  // Endereço
  if (isEmpty(staff.cep)) missing.push('cep')
  if (isEmpty(staff.state)) missing.push('state')
  if (isEmpty(staff.city)) missing.push('city')

  // Upload
  if (isEmpty(staff.photoUrl)) missing.push('photoUrl')

  // Vínculo
  if (isEmpty(staff.teamId)) missing.push('teamId')

  return {
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    teamId: staff.teamId,
    teamName: staff.team?.name ?? null,
    situation: staff.situation,
    isActive: staff.isActive,
    isTechnical,
    isComplete: missing.length === 0,
    missingFields: missing,
    totalProblems: missing.length
  }
}

export const MISSING_FIELD_LABELS: Record<MissingFieldKey, string> = {
  name: 'Nome',
  role: 'Cargo',
  sex: 'Sexo',
  birthDate: 'Data de nascimento',
  cpf: 'CPF',
  rg: 'RG',
  contact: 'Contato (celular ou telefone)',
  crefi: 'CREF (obrigatório para técnicos)',
  cep: 'CEP',
  state: 'Estado',
  city: 'Cidade',
  photoUrl: 'Foto',
  teamId: 'Vínculo com clube'
}
