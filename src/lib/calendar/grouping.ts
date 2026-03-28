export function assignPhasesToGroups(
  groups: any[][],
  phases: number,
  startDate: Date
): Date[][] {
  const result: Date[][] = []
  
  // Encontrar o primeiro sábado após startDate
  const firstSat = new Date(startDate)
  while (firstSat.getDay() !== 6) {
    firstSat.setDate(firstSat.getDate() + 1)
  }
  firstSat.setHours(11, 0, 0, 0) // 08:00 BRT
  
  // Cada grupo ganha seus fins de semana exclusivos
  // Ex: Grupo 1 (Fase 1, 2, 3) e Grupo 2 (Fase 1, 2, 3)
  // Estratégia: Alternar grupos para não demorar muito para um grupo jogar
  // G1F1, G2F1, G1F2, G2F2...
  
  let weekOffset = 0
  
  // Inicializar o array de datas por grupo
  for (let i = 0; i < groups.length; i++) {
    result[i] = []
  }
  
  for (let p = 0; p < phases; p++) {
    for (let g = 0; g < groups.length; g++) {
      const date = new Date(firstSat)
      date.setDate(date.getDate() + weekOffset * 7)
      result[g].push(date)
      weekOffset++ // Cada fase de cada grupo ganha 1 semana exclusive
    }
  }
  
  return result
}
