import { Prisma, type AthleteRegistrationRequest } from '@prisma/client'

import { prisma } from '@/lib/db'

export const ATHLETE_REQUEST_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CBB_CHECK_PENDING',
  'CBB_CHECKED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const

export const ATHLETE_CBB_CHECK_STATUSES = ['PENDING', 'CHECKED'] as const

export const ATHLETE_FEDERATION_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'TRANSFERRED_OUT',
] as const

export type AthleteRequestStatus = (typeof ATHLETE_REQUEST_STATUSES)[number]
export type AthleteCbbCheckStatus = (typeof ATHLETE_CBB_CHECK_STATUSES)[number]

export const ATHLETE_REQUEST_INCLUDE = {
  team: { select: { id: true, name: true } },
  athlete: { select: { id: true, name: true, status: true, teamId: true } },
  cbbCheckedByUser: { select: { id: true, name: true, email: true } },
  reviewedByUser: { select: { id: true, name: true, email: true } },
  approvedByUser: { select: { id: true, name: true, email: true } },
  auditLogs: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      createdByUser: { select: { id: true, name: true, email: true } },
    },
  },
} satisfies Prisma.AthleteRegistrationRequestInclude

export function normalizeDocumentNumber(value: string) {
  return String(value || '').replace(/\D+/g, '')
}

export function assertAthleteRequestStatus(value: string): asserts value is AthleteRequestStatus {
  if (!ATHLETE_REQUEST_STATUSES.includes(value as AthleteRequestStatus)) {
    throw new AthleteRegistrationError(`Status de solicitacao invalido: ${value}`, 400)
  }
}

export function assertCbbCheckStatus(value: string): asserts value is AthleteCbbCheckStatus {
  if (!ATHLETE_CBB_CHECK_STATUSES.includes(value as AthleteCbbCheckStatus)) {
    throw new AthleteRegistrationError(`Status de conferencia CBB invalido: ${value}`, 400)
  }
}

export function canTeamEditAthleteRequest(request: Pick<AthleteRegistrationRequest, 'status'>) {
  return request.status === 'DRAFT'
}

export function canTeamCancelAthleteRequest(request: Pick<AthleteRegistrationRequest, 'status'>) {
  return ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CBB_CHECK_PENDING', 'CBB_CHECKED'].includes(request.status)
}

export function canAdminApproveAthleteRequest(request: Pick<AthleteRegistrationRequest, 'status'>) {
  return ['SUBMITTED', 'UNDER_REVIEW', 'CBB_CHECK_PENDING', 'CBB_CHECKED'].includes(request.status)
}

export function canAdminRejectAthleteRequest(request: Pick<AthleteRegistrationRequest, 'status'>) {
  return ['SUBMITTED', 'UNDER_REVIEW', 'CBB_CHECK_PENDING', 'CBB_CHECKED'].includes(request.status)
}

export class AthleteRegistrationError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'AthleteRegistrationError'
    this.status = status
  }
}

type DbClient = Prisma.TransactionClient | typeof prisma

type CreateAuditInput = {
  requestId: string
  action: string
  description: string
  metadata?: Record<string, unknown> | null
  createdByUserId?: string | null
}

export async function createAthleteRegistrationAuditLog(
  tx: DbClient,
  { requestId, action, description, metadata, createdByUserId }: CreateAuditInput
) {
  return tx.athleteRegistrationAuditLog.create({
    data: {
      requestId,
      action,
      description,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
      createdByUserId: createdByUserId || null,
    },
  })
}

type RequestDraftInput = {
  fullName: string
  birthDate: string | Date
  documentNumber: string
  motherName?: string | null
  phone?: string | null
  email?: string | null
  requestedCategoryLabel?: string | null
  cbbRegistrationNumber?: string | null
  // PM-06.N: dados pessoais
  sex?: string | null
  nationality?: string | null
  maritalStatus?: string | null
  education?: string | null
  // PM-06.N: documentos
  rg?: string | null
  rgOrgan?: string | null
  rgDate?: string | Date | null
  cpf?: string | null
  // PM-06.N: endereço
  cep?: string | null
  state?: string | null
  city?: string | null
  address?: string | null
  addressNum?: string | null
  addressComp?: string | null
  // PM-06.N: filiação
  fatherName?: string | null
  parentContactPhone?: string | null
  parentContactRole?: 'MOTHER' | 'FATHER' | string | null
  // PM-06.N: esportivo
  height?: number | string | null
  weight?: number | string | null
  position?: string | null
  jerseyNumber?: number | string | null
  // PM-06.N: uploads
  photoUrl?: string | null
  docCPFFrontUrl?: string | null
  docCPFBackUrl?: string | null
  docRGFrontUrl?: string | null
  docRGBackUrl?: string | null
  docBirthCertUrl?: string | null
  docOtherUrl?: string | null
}

function normalizeDraftInput(input: RequestDraftInput) {
  const fullName = String(input.fullName || '').trim()
  const documentNumber = String(input.documentNumber || '').trim()
  const normalizedDocument = normalizeDocumentNumber(documentNumber)
  const birthDate = input.birthDate ? new Date(input.birthDate) : null

  if (!fullName) {
    throw new AthleteRegistrationError('Informe o nome completo do atleta.', 400)
  }

  if (!birthDate || Number.isNaN(birthDate.getTime())) {
    throw new AthleteRegistrationError('Informe uma data de nascimento valida.', 400)
  }

  if (!documentNumber || !normalizedDocument) {
    throw new AthleteRegistrationError('Informe o documento do atleta.', 400)
  }

  // PM-06.N: parsers tolerantes para campos opcionais (inválido → null)
  const optStr = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const optDate = (v: unknown) => {
    if (!v) return null
    const d = new Date(v as any)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const optFloat = (v: unknown) => {
    if (v === null || v === undefined || v === '') return null
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
    return Number.isNaN(n) ? null : n
  }
  const optInt = (v: unknown) => {
    if (v === null || v === undefined || v === '') return null
    const n = typeof v === 'number' ? Math.trunc(v) : parseInt(String(v), 10)
    return Number.isNaN(n) ? null : n
  }
  const optParentRole = (v: unknown) => {
    const s = optStr(v)?.toUpperCase()
    return s === 'MOTHER' || s === 'FATHER' ? s : null
  }

  return {
    fullName,
    birthDate,
    documentNumber,
    documentNumberNormalized: normalizedDocument,
    motherName: input.motherName?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    requestedCategoryLabel: input.requestedCategoryLabel?.trim() || null,
    cbbRegistrationNumber: input.cbbRegistrationNumber?.trim() || null,
    // PM-06.N: dados pessoais
    sex: optStr(input.sex),
    nationality: optStr(input.nationality),
    maritalStatus: optStr(input.maritalStatus),
    education: optStr(input.education),
    // PM-06.N: documentos
    rg: optStr(input.rg),
    rgOrgan: optStr(input.rgOrgan),
    rgDate: optDate(input.rgDate),
    cpf: optStr(input.cpf),
    // PM-06.N: endereço
    cep: optStr(input.cep),
    state: optStr(input.state),
    city: optStr(input.city),
    address: optStr(input.address),
    addressNum: optStr(input.addressNum),
    addressComp: optStr(input.addressComp),
    // PM-06.N: filiação
    fatherName: optStr(input.fatherName),
    parentContactPhone: optStr(input.parentContactPhone),
    parentContactRole: optParentRole(input.parentContactRole),
    // PM-06.N: esportivo
    height: optFloat(input.height),
    weight: optFloat(input.weight),
    position: optStr(input.position),
    jerseyNumber: optInt(input.jerseyNumber),
    // PM-06.N: uploads
    photoUrl: optStr(input.photoUrl),
    docCPFFrontUrl: optStr(input.docCPFFrontUrl),
    docCPFBackUrl: optStr(input.docCPFBackUrl),
    docRGFrontUrl: optStr(input.docRGFrontUrl),
    docRGBackUrl: optStr(input.docRGBackUrl),
    docBirthCertUrl: optStr(input.docBirthCertUrl),
    docOtherUrl: optStr(input.docOtherUrl),
  }
}

export async function createTeamAthleteRequest(
  teamId: string,
  input: RequestDraftInput & { initialStatus?: AthleteRequestStatus },
  createdByUserId?: string | null
) {
  const normalized = normalizeDraftInput(input)
  const status = input.initialStatus || 'DRAFT'
  assertAthleteRequestStatus(status)
  const submittedAt = status === 'SUBMITTED' ? new Date() : null

  const request = await prisma.athleteRegistrationRequest.create({
    data: {
      teamId,
      status,
      cbbCheckStatus: 'PENDING',
      submittedAt,
      ...normalized,
    },
    include: ATHLETE_REQUEST_INCLUDE,
  })

  await createAthleteRegistrationAuditLog(prisma, {
    requestId: request.id,
    action: status === 'SUBMITTED' ? 'REQUEST_SUBMITTED' : 'REQUEST_CREATED',
    description:
      status === 'SUBMITTED'
        ? 'Solicitacao criada e enviada pela equipe.'
        : 'Solicitacao criada como rascunho pela equipe.',
    metadata: { teamId, status },
    createdByUserId,
  })

  return request
}

export async function updateTeamAthleteRequestDraft(
  teamId: string,
  requestId: string,
  input: RequestDraftInput,
  createdByUserId?: string | null
) {
  const existing = await prisma.athleteRegistrationRequest.findFirst({
    where: { id: requestId, teamId },
  })

  if (!existing) {
    throw new AthleteRegistrationError('Solicitacao nao encontrada.', 404)
  }

  if (!canTeamEditAthleteRequest(existing)) {
    throw new AthleteRegistrationError('Apenas solicitacoes em rascunho podem ser editadas.', 400)
  }

  const normalized = normalizeDraftInput(input)

  const request = await prisma.athleteRegistrationRequest.update({
    where: { id: requestId },
    data: normalized,
    include: ATHLETE_REQUEST_INCLUDE,
  })

  await createAthleteRegistrationAuditLog(prisma, {
    requestId: request.id,
    action: 'REQUEST_UPDATED',
    description: 'Rascunho da solicitacao atualizado pela equipe.',
    metadata: { teamId },
    createdByUserId,
  })

  return request
}

export async function submitTeamAthleteRequest(teamId: string, requestId: string, createdByUserId?: string | null) {
  const existing = await prisma.athleteRegistrationRequest.findFirst({
    where: { id: requestId, teamId },
  })

  if (!existing) {
    throw new AthleteRegistrationError('Solicitacao nao encontrada.', 404)
  }

  if (existing.status !== 'DRAFT') {
    throw new AthleteRegistrationError('Somente rascunhos podem ser enviados.', 400)
  }

  const request = await prisma.athleteRegistrationRequest.update({
    where: { id: requestId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      rejectionReason: null,
    },
    include: ATHLETE_REQUEST_INCLUDE,
  })

  await createAthleteRegistrationAuditLog(prisma, {
    requestId,
    action: 'REQUEST_SUBMITTED',
    description: 'Solicitacao enviada pela equipe para analise da federacao.',
    metadata: { teamId },
    createdByUserId,
  })

  return request
}

export async function cancelTeamAthleteRequest(teamId: string, requestId: string, createdByUserId?: string | null) {
  const existing = await prisma.athleteRegistrationRequest.findFirst({
    where: { id: requestId, teamId },
  })

  if (!existing) {
    throw new AthleteRegistrationError('Solicitacao nao encontrada.', 404)
  }

  if (!canTeamCancelAthleteRequest(existing)) {
    throw new AthleteRegistrationError('Esta solicitacao nao pode mais ser cancelada.', 400)
  }

  const request = await prisma.athleteRegistrationRequest.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' },
    include: ATHLETE_REQUEST_INCLUDE,
  })

  await createAthleteRegistrationAuditLog(prisma, {
    requestId,
    action: 'REQUEST_CANCELLED',
    description: 'Solicitacao cancelada pela equipe.',
    metadata: { teamId, previousStatus: existing.status },
    createdByUserId,
  })

  return request
}

export async function markAthleteRequestCbbCheck(
  requestId: string,
  input: {
    cbbCheckStatus: AthleteCbbCheckStatus
    cbbNotes?: string | null
    cbbReference?: string | null
    cbbDocumentMatch?: boolean | null
    cbbNameMatch?: boolean | null
    cbbBirthDateMatch?: boolean | null
  },
  createdByUserId?: string | null
) {
  assertCbbCheckStatus(input.cbbCheckStatus)

  const existing = await prisma.athleteRegistrationRequest.findUnique({
    where: { id: requestId },
  })

  if (!existing) {
    throw new AthleteRegistrationError('Solicitacao nao encontrada.', 404)
  }

  if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(existing.status)) {
    throw new AthleteRegistrationError('Nao e possivel alterar a conferencia CBB desta solicitacao.', 400)
  }

  const checkedAt = input.cbbCheckStatus === 'CHECKED' ? new Date() : null
  const nextStatus = input.cbbCheckStatus === 'CHECKED' ? 'CBB_CHECKED' : 'CBB_CHECK_PENDING'

  const request = await prisma.athleteRegistrationRequest.update({
    where: { id: requestId },
    data: {
      cbbCheckStatus: input.cbbCheckStatus,
      cbbCheckedAt: checkedAt,
      cbbCheckedByUserId: input.cbbCheckStatus === 'CHECKED' ? createdByUserId || null : null,
      cbbNotes: input.cbbNotes?.trim() || null,
      cbbReference: input.cbbReference?.trim() || null,
      cbbDocumentMatch: input.cbbDocumentMatch ?? null,
      cbbNameMatch: input.cbbNameMatch ?? null,
      cbbBirthDateMatch: input.cbbBirthDateMatch ?? null,
      status: nextStatus,
      reviewedAt: new Date(),
      reviewedByUserId: createdByUserId || null,
    },
    include: ATHLETE_REQUEST_INCLUDE,
  })

  await createAthleteRegistrationAuditLog(prisma, {
    requestId,
    action: 'CBB_CHECK_UPDATED',
    description:
      input.cbbCheckStatus === 'CHECKED'
        ? 'Conferencia manual com a CBB marcada como conferida.'
        : 'Conferencia manual com a CBB marcada como pendente.',
    metadata: {
      cbbCheckStatus: input.cbbCheckStatus,
      cbbDocumentMatch: input.cbbDocumentMatch ?? null,
      cbbNameMatch: input.cbbNameMatch ?? null,
      cbbBirthDateMatch: input.cbbBirthDateMatch ?? null,
    },
    createdByUserId,
  })

  return request
}

export async function approveAthleteRegistrationRequest(requestId: string, createdByUserId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.athleteRegistrationRequest.findUnique({
      where: { id: requestId },
    })

    if (!existing) {
      throw new AthleteRegistrationError('Solicitacao nao encontrada.', 404)
    }

    if (!canAdminApproveAthleteRequest(existing)) {
      throw new AthleteRegistrationError('Esta solicitacao nao pode ser aprovada no status atual.', 400)
    }

    const athlete = await tx.athlete.create({
      data: {
        name: existing.fullName,
        birthDate: existing.birthDate,
        document: existing.documentNumber,
        teamId: existing.teamId,
        status: 'ACTIVE',
      },
    })

    const now = new Date()

    const request = await tx.athleteRegistrationRequest.update({
      where: { id: requestId },
      data: {
        athleteId: athlete.id,
        status: 'APPROVED',
        approvedAt: now,
        approvedByUserId: createdByUserId || null,
        reviewedAt: now,
        reviewedByUserId: createdByUserId || null,
        rejectionReason: null,
      },
      include: ATHLETE_REQUEST_INCLUDE,
    })

    await createAthleteRegistrationAuditLog(tx, {
      requestId,
      action: 'REQUEST_APPROVED',
      description: 'Solicitacao aprovada pela federacao e atleta federativo criado.',
      metadata: { athleteId: athlete.id, teamId: existing.teamId, athleteStatus: athlete.status },
      createdByUserId,
    })

    return request
  })
}

export async function rejectAthleteRegistrationRequest(
  requestId: string,
  rejectionReason: string,
  createdByUserId?: string | null
) {
  const existing = await prisma.athleteRegistrationRequest.findUnique({
    where: { id: requestId },
  })

  if (!existing) {
    throw new AthleteRegistrationError('Solicitacao nao encontrada.', 404)
  }

  if (!canAdminRejectAthleteRequest(existing)) {
    throw new AthleteRegistrationError('Esta solicitacao nao pode ser rejeitada no status atual.', 400)
  }

  const reason = String(rejectionReason || '').trim()
  if (!reason) {
    throw new AthleteRegistrationError('Informe o motivo da rejeicao.', 400)
  }

  const request = await prisma.athleteRegistrationRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedByUserId: createdByUserId || null,
    },
    include: ATHLETE_REQUEST_INCLUDE,
  })

  await createAthleteRegistrationAuditLog(prisma, {
    requestId,
    action: 'REQUEST_REJECTED',
    description: 'Solicitacao rejeitada pela federacao.',
    metadata: { rejectionReason: reason },
    createdByUserId,
  })

  return request
}
