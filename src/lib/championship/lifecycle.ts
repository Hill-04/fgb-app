import { prisma } from '@/lib/db'

export type ChampionshipStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'TECHNICAL_CONGRESS_SCHEDULED'
  | 'TECHNICAL_CONGRESS_DONE'
  | 'DRAW_DONE'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'FINISHED'
  | 'ARCHIVED'
  // estados legados
  | 'ONGOING'
  | 'ACTIVE'
  | 'ORGANIZING'

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  REGISTRATION_OPEN: 'Inscrições abertas',
  REGISTRATION_CLOSED: 'Inscrições encerradas',
  TECHNICAL_CONGRESS_SCHEDULED: 'Congresso técnico agendado',
  TECHNICAL_CONGRESS_DONE: 'Congresso técnico realizado',
  DRAW_DONE: 'Sorteio concluído',
  SCHEDULED: 'Tabela publicada',
  IN_PROGRESS: 'Em andamento',
  PAUSED: 'Pausado',
  FINISHED: 'Encerrado',
  ARCHIVED: 'Arquivado',
  ONGOING: 'Em andamento',
  ACTIVE: 'Ativo',
  ORGANIZING: 'Organizando',
}

const TRANSITIONS: Record<string, ChampionshipStatus[]> = {
  DRAFT: ['PUBLISHED', 'REGISTRATION_OPEN', 'ARCHIVED'],
  PUBLISHED: ['REGISTRATION_OPEN', 'DRAFT', 'ARCHIVED'],
  REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'PAUSED', 'ARCHIVED'],
  REGISTRATION_CLOSED: ['TECHNICAL_CONGRESS_SCHEDULED', 'DRAW_DONE', 'SCHEDULED', 'PAUSED'],
  TECHNICAL_CONGRESS_SCHEDULED: ['TECHNICAL_CONGRESS_DONE', 'PAUSED'],
  TECHNICAL_CONGRESS_DONE: ['DRAW_DONE', 'SCHEDULED', 'PAUSED'],
  DRAW_DONE: ['SCHEDULED', 'PAUSED'],
  SCHEDULED: ['IN_PROGRESS', 'PAUSED', 'DRAW_DONE'],
  IN_PROGRESS: ['PAUSED', 'FINISHED'],
  ONGOING: ['PAUSED', 'FINISHED'],
  ACTIVE: ['PAUSED', 'FINISHED'],
  ORGANIZING: ['SCHEDULED', 'IN_PROGRESS', 'PAUSED'],
  PAUSED: ['IN_PROGRESS', 'SCHEDULED', 'FINISHED', 'ARCHIVED'],
  FINISHED: ['ARCHIVED'],
  ARCHIVED: [],
}

export function canTransition(from: string, to: ChampionshipStatus): boolean {
  if (from === to) return true
  return (TRANSITIONS[from] ?? []).includes(to)
}

export function getAllowedTransitions(from: string): ChampionshipStatus[] {
  return TRANSITIONS[from] ?? []
}

export type TransitionResult =
  | { ok: true; status: ChampionshipStatus }
  | { ok: false; error: string }

export async function transitionChampionship(
  championshipId: string,
  toStatus: ChampionshipStatus,
  options: {
    performedBy?: string
    reason?: string
    metadata?: Record<string, unknown>
    force?: boolean
  } = {},
): Promise<TransitionResult> {
  const champ = await prisma.championship.findUnique({
    where: { id: championshipId },
    select: { id: true, status: true },
  })
  if (!champ) return { ok: false, error: 'Campeonato não encontrado' }

  if (!options.force && !canTransition(champ.status, toStatus)) {
    return {
      ok: false,
      error: `Transição inválida: ${champ.status} → ${toStatus}`,
    }
  }

  const timestampUpdates: Record<string, Date> = {}
  const now = new Date()
  if (toStatus === 'PUBLISHED') timestampUpdates.publishedAt = now
  if (toStatus === 'REGISTRATION_OPEN') timestampUpdates.registrationOpenedAt = now
  if (toStatus === 'FINISHED') timestampUpdates.finishedAt = now

  await prisma.$transaction(async (tx) => {
    await tx.championship.update({
      where: { id: championshipId },
      data: { status: toStatus, ...timestampUpdates },
    })
    await tx.championshipStatusTransition.create({
      data: {
        championshipId,
        fromStatus: champ.status,
        toStatus,
        reason: options.reason,
        performedBy: options.performedBy,
        metadataJson: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    })
  })

  return { ok: true, status: toStatus }
}
