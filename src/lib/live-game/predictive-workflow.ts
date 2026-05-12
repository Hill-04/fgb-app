export type PredictivePrompt = {
  type: 'OFFER_FTS' | 'WHO_REBOUNDED' | 'WHO_ASSISTED' | 'WHO_SUBBED_IN'
  prompt: string
  options: { id: string; label: string; keyboard?: string }[]
}

/**
 * Dado o último evento + contexto, retorna prompt sugerido (ou null).
 *
 * Regras:
 * 1. FOUL_PERSONAL → propor 1/2/3 lances livres ou nenhum
 * 2. SHOT_MISSED_* / FREE_THROW_MISSED → propor quem pegou o rebote
 * 3. SHOT_MADE_2 / SHOT_MADE_3 → propor quem deu a assistência (ou nenhum)
 */
export function getPredictivePrompt(
  lastEventType: string,
  context: {
    lastEventTeamId: string
    lastEventAthleteId: string | null
    onCourtPlayers: { id: string; name: string; teamId: string; jerseyNumber: number | null }[]
    shotSubType?: string
  }
): PredictivePrompt | null {
  if (lastEventType === 'FOUL_PERSONAL') {
    return {
      type: 'OFFER_FTS',
      prompt: 'Houve falta. Cabe lance livre?',
      options: [
        { id: 'fts_1', label: '1 lance livre', keyboard: '1' },
        { id: 'fts_2', label: '2 lances livres', keyboard: '2' },
        { id: 'fts_3', label: '3 lances livres', keyboard: '3' },
        { id: 'no_fts', label: 'Sem lance livre', keyboard: 'n' },
      ],
    }
  }

  if (lastEventType === 'SHOT_MISSED_2' || lastEventType === 'SHOT_MISSED_3' || lastEventType === 'FREE_THROW_MISSED') {
    return {
      type: 'WHO_REBOUNDED',
      prompt: 'Quem pegou o rebote?',
      options: context.onCourtPlayers
        .slice(0, 8)
        .map(p => ({
          id: p.id,
          label: `#${p.jerseyNumber ?? '?'} ${p.name}`,
        })),
    }
  }

  if (lastEventType === 'SHOT_MADE_2' || lastEventType === 'SHOT_MADE_3') {
    const teammates = context.onCourtPlayers.filter(
      p => p.teamId === context.lastEventTeamId && p.id !== context.lastEventAthleteId
    )
    return {
      type: 'WHO_ASSISTED',
      prompt: 'Houve assistência?',
      options: [
        { id: 'no_assist', label: 'Sem assistência', keyboard: 'n' },
        ...teammates.slice(0, 6).map(p => ({
          id: p.id,
          label: `#${p.jerseyNumber ?? '?'} ${p.name}`,
        })),
      ],
    }
  }

  return null
}
