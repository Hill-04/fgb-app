interface ValidationResult {
  isValid: boolean
  error?: string
  warning?: string
}

export function validateCategoryTeams(count: number): ValidationResult {
  if (count < 2) {
    return {
      isValid: false,
      error: 'Categoria sem equipes mínimas para gerar confrontos (precisa de pelo menos 2).',
    }
  }

  if (count === 2) {
    return {
      isValid: true,
      warning: 'A FGB recomenda no mínimo 3 equipes por categoria. Com apenas 2 equipes, o agendamento seguirá com um único confronto direto.',
    }
  }

  if (count === 3) {
    return {
      isValid: true,
      warning: 'Categoria com 3 equipes: Considerar que um time folgará em cada rodada do trio.',
    }
  }

  return { isValid: true }
}
