interface ChampionshipConfigInput {
  numberOfCourts?: number
  [key: string]: unknown
}

interface ChampionshipConfigResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  numberOfCourts: number
}

export function validateChampionshipConfig(
  input: ChampionshipConfigInput
): ChampionshipConfigResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Default para 1 quadra quando não informado
  const numberOfCourts = input.numberOfCourts ?? 1

  if (numberOfCourts < 1) {
    errors.push('Número de quadras deve ser pelo menos 1.')
  }

  if (numberOfCourts > 6) {
    warnings.push(
      `${numberOfCourts} quadras é um número incomum para ginásios de basquete. Confirme se está correto.`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    numberOfCourts,
  }
}
