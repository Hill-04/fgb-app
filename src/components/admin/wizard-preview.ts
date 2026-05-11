/**
 * Pure calculation helpers for the Championship Wizard preview panel.
 *
 * Sem side-effects, sem hooks — soh matematica. Testavel facilmente.
 */

export type PreviewPhase = {
  name: string
  mode: "TRADITIONAL" | "ENCOUNTER"
  formatType: "ROUND_ROBIN" | "ELIMINATORIO" | "GROUPS_ELIMINATORIO"
  qualifiesNextCount?: string
}

export type WizardForm = {
  categories: string[]
  minTeamsPerCat: string
  format: string
  turns: string
  phases: string
  hasMultiplePhases: boolean
  customPhases: PreviewPhase[]
  hasPlayoffs: boolean
  playoffTeams: string
  playoffFormat: string
  hasThirdPlace: boolean
  allowedWeekdays: number[]
  maxGamesPerTeamPerWeek: string
  startDate: string
  endDate: string
}

// ─────────────── games per format ───────────────

/** Jogos em todos-contra-todos: C(n, 2) = n*(n-1)/2, multiplicado por turnos. */
export function roundRobinGames(teams: number, turns: number): number {
  if (teams < 2) return 0
  return (teams * (teams - 1)) / 2 * turns
}

/** Single elimination: n_teams - 1 (sem disputa de 3o lugar). */
export function singleEliminationGames(teams: number, hasThirdPlace: boolean = false): number {
  if (teams < 2) return 0
  return (teams - 1) + (hasThirdPlace ? 1 : 0)
}

/** Best-of-N series: media de jogos esperados (~ N - (N-1)/2). */
export function bestOfAverageGames(format: string): number {
  if (format === "melhor_de_1") return 1
  if (format === "melhor_de_3") return 2.2 // ~2-3 jogos
  if (format === "melhor_de_5") return 3.7 // ~4-5 jogos
  if (format === "melhor_de_7") return 5.3 // ~5-7 jogos
  return 1
}

/** Jogos numa fase de playoffs (mata-mata best-of-N). */
export function playoffSeriesGames(playoffTeams: number, playoffFormat: string, hasThirdPlace: boolean): number {
  if (playoffTeams < 2) return 0
  const matches = (playoffTeams - 1) + (hasThirdPlace ? 1 : 0)
  return Math.round(matches * bestOfAverageGames(playoffFormat))
}

// ─────────────── jogos por categoria ───────────────

export type PhaseBreakdown = {
  name: string
  games: number
  rationale: string
}

export function estimateGamesPerCategory(opts: {
  teams: number
  format: string
  turns: number
  hasMultiplePhases: boolean
  customPhases: PreviewPhase[]
  hasPlayoffs: boolean
  playoffTeams: number
  playoffFormat: string
  hasThirdPlace: boolean
}): { phases: PhaseBreakdown[]; total: number } {
  const phases: PhaseBreakdown[] = []

  if (opts.hasMultiplePhases && opts.customPhases.length > 0) {
    let teamsAtPhase = opts.teams
    for (const p of opts.customPhases) {
      let games = 0
      let rationale = ""
      if (p.mode === "ENCOUNTER") {
        // encontro: assume todos-contra-todos no sede unica
        games = roundRobinGames(teamsAtPhase, 1)
        rationale = `Encontro · ${teamsAtPhase} times · 1 turno`
      } else if (p.formatType === "ROUND_ROBIN") {
        games = roundRobinGames(teamsAtPhase, opts.turns)
        rationale = `Todos x todos · ${teamsAtPhase} times · ${opts.turns} turno(s)`
      } else if (p.formatType === "ELIMINATORIO") {
        games = singleEliminationGames(teamsAtPhase, false)
        rationale = `Mata-mata · ${teamsAtPhase} times`
      } else if (p.formatType === "GROUPS_ELIMINATORIO") {
        // heuristic: 2 grupos round-robin + bracket de qualificados
        const groupSize = Math.max(2, Math.ceil(teamsAtPhase / 2))
        const groupGames = 2 * roundRobinGames(groupSize, opts.turns)
        const qualifiers = Math.min(teamsAtPhase, 2 * Math.ceil(teamsAtPhase / 4))
        const bracket = singleEliminationGames(qualifiers)
        games = groupGames + bracket
        rationale = `2 grupos · ${qualifiers} classificados · mata-mata`
      }
      phases.push({ name: p.name, games, rationale })

      // reduzir times pro proximo estagio se houver qualifiesNextCount
      const next = p.qualifiesNextCount ? Number(p.qualifiesNextCount) : NaN
      if (!Number.isNaN(next) && next > 0) {
        teamsAtPhase = Math.min(teamsAtPhase, next)
      }
    }
  } else if (opts.format === "todos_contra_todos") {
    const games = roundRobinGames(opts.teams, opts.turns)
    phases.push({
      name: "Fase única",
      games,
      rationale: `Todos x todos · ${opts.teams} times · ${opts.turns} turno(s)`,
    })
  } else if (opts.format === "eliminatorio") {
    const games = singleEliminationGames(opts.teams)
    phases.push({
      name: "Mata-mata",
      games,
      rationale: `Eliminatório · ${opts.teams} times`,
    })
  } else if (opts.format === "grupos") {
    const groupSize = Math.max(2, Math.ceil(opts.teams / 2))
    const groupGames = 2 * roundRobinGames(groupSize, opts.turns)
    const qualifiers = Math.min(opts.teams, 2 * Math.ceil(opts.teams / 4))
    const bracket = singleEliminationGames(qualifiers)
    phases.push({
      name: "Grupos + Mata-mata",
      games: groupGames + bracket,
      rationale: `2 grupos · ${qualifiers} classificados`,
    })
  } else {
    // formato desconhecido: usa round-robin como fallback
    const games = roundRobinGames(opts.teams, opts.turns)
    phases.push({
      name: "Fase",
      games,
      rationale: `Estimativa: ${opts.teams} times`,
    })
  }

  if (opts.hasPlayoffs && opts.playoffTeams >= 2) {
    const games = playoffSeriesGames(opts.playoffTeams, opts.playoffFormat, opts.hasThirdPlace)
    phases.push({
      name: "Playoffs",
      games,
      rationale: `${opts.playoffTeams} times · ${opts.playoffFormat.replace(/_/g, " ")}${
        opts.hasThirdPlace ? " · 3º lugar" : ""
      }`,
    })
  }

  const total = phases.reduce((acc, p) => acc + p.games, 0)
  return { phases, total }
}

// ─────────────── duracao estimada ───────────────

/**
 * Estima semanas necessarias dado o total de jogos.
 *
 * Heuristica: cada dia disponivel (weekday) suporta ~4 jogos paralelos em diferentes
 * sedes/quadras. Total por semana = weekdaysCount * 4. Limite: maxGamesPerTeamPerWeek
 * limita a velocidade individual mas nao o agregado da liga.
 */
export function estimateDurationWeeks(opts: {
  totalGames: number
  weekdaysCount: number
}): number {
  if (opts.totalGames <= 0) return 0
  const gamesPerWeek = Math.max(1, opts.weekdaysCount * 4)
  return Math.ceil(opts.totalGames / gamesPerWeek)
}

// ─────────────── conflitos ───────────────

export type ConflictSeverity = "ok" | "warning" | "error"

export type Conflict = {
  severity: ConflictSeverity
  title: string
  detail: string
}

export function detectConflicts(opts: {
  form: WizardForm
  totalGames: number
  estimatedWeeks: number
}): Conflict[] {
  const conflicts: Conflict[] = []
  const start = opts.form.startDate ? new Date(opts.form.startDate) : null
  const end = opts.form.endDate ? new Date(opts.form.endDate) : null

  // Janela de competicao
  if (start && end) {
    const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const weeks = days / 7
    if (weeks < opts.estimatedWeeks) {
      conflicts.push({
        severity: "error",
        title: "Janela curta demais",
        detail: `Periodo de ${days} dias (~${weeks.toFixed(1)} sem) menor que duracao estimada (${
          opts.estimatedWeeks
        } sem). Considere mais dias da semana ou reduzir formato.`,
      })
    } else if (weeks < opts.estimatedWeeks * 1.2) {
      conflicts.push({
        severity: "warning",
        title: "Janela apertada",
        detail: `Periodo apenas 20% acima do estimado. Pouca folga para reagendamentos.`,
      })
    }
  }

  // Categorias sem times
  if (opts.form.categories.length === 0) {
    conflicts.push({
      severity: "warning",
      title: "Nenhuma categoria",
      detail: "Selecione ao menos uma categoria no passo Categorias.",
    })
  }

  // Multiplas fases sem definir
  if (opts.form.hasMultiplePhases && opts.form.customPhases.length === 0) {
    conflicts.push({
      severity: "warning",
      title: "Múltiplas fases vazias",
      detail: "Toggle de multiplas fases ativo mas nenhuma fase configurada.",
    })
  }

  // Dias da semana vazios
  if (opts.form.allowedWeekdays.length === 0) {
    conflicts.push({
      severity: "error",
      title: "Sem dias permitidos",
      detail: "Selecione ao menos um dia da semana para os jogos.",
    })
  } else if (opts.form.allowedWeekdays.length === 1 && opts.totalGames > 20) {
    conflicts.push({
      severity: "warning",
      title: "Apenas 1 dia da semana",
      detail: `Com ${opts.totalGames} jogos estimados e so 1 dia disponivel, duracao pode ficar longa (${opts.estimatedWeeks} semanas).`,
    })
  }

  // Playoffs com poucos times
  if (opts.form.hasPlayoffs) {
    const playoff = Number(opts.form.playoffTeams || "0")
    const teams = Number(opts.form.minTeamsPerCat || "0")
    if (playoff > teams) {
      conflicts.push({
        severity: "error",
        title: "Playoffs com mais times que inscritos",
        detail: `Playoffs configurado para ${playoff} mas min. equipes/categoria e ${teams}.`,
      })
    }
  }

  return conflicts
}

// ─────────────── tudo junto ───────────────

export type PreviewSummary = {
  teamsPerCategory: number
  categoriesCount: number
  totalTeams: number
  phaseBreakdown: PhaseBreakdown[]
  gamesPerCategory: number
  totalGames: number
  estimatedWeeks: number
  conflicts: Conflict[]
  hasError: boolean
  hasWarning: boolean
}

export function computePreview(form: WizardForm): PreviewSummary {
  const teamsPerCategory = Math.max(0, Number(form.minTeamsPerCat || "0"))
  const categoriesCount = form.categories.length

  const { phases, total: gamesPerCategory } = estimateGamesPerCategory({
    teams: teamsPerCategory,
    format: form.format,
    turns: Math.max(1, Number(form.turns || "1")),
    hasMultiplePhases: form.hasMultiplePhases,
    customPhases: form.customPhases,
    hasPlayoffs: form.hasPlayoffs,
    playoffTeams: Math.max(0, Number(form.playoffTeams || "0")),
    playoffFormat: form.playoffFormat,
    hasThirdPlace: form.hasThirdPlace,
  })

  const totalGames = gamesPerCategory * Math.max(1, categoriesCount)
  const estimatedWeeks = estimateDurationWeeks({
    totalGames,
    weekdaysCount: form.allowedWeekdays.length,
  })

  const conflicts = detectConflicts({ form, totalGames, estimatedWeeks })

  return {
    teamsPerCategory,
    categoriesCount,
    totalTeams: teamsPerCategory * categoriesCount,
    phaseBreakdown: phases,
    gamesPerCategory,
    totalGames,
    estimatedWeeks,
    conflicts,
    hasError: conflicts.some(c => c.severity === "error"),
    hasWarning: conflicts.some(c => c.severity === "warning"),
  }
}
