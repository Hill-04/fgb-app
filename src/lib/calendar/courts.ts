interface GameSlot {
  id?: string
  dateTime: Date
  court?: string
}

export function assignCourts<T extends { dateTime: Date; court?: string }>(
  slots: T[],
  numberOfCourts: number = 1
): T[] {
  const result = [...slots]
  const slotsByTime = new Map<number, T[]>()
  
  for (const slot of result) {
    const time = slot.dateTime.getTime()
    if (!slotsByTime.has(time)) slotsByTime.set(time, [])
    slotsByTime.get(time)!.push(slot)
  }
  
  for (const [, games] of slotsByTime.entries()) {
    if (numberOfCourts <= 1) {
      games[0].court = 'Quadra Única'
    } else {
      games.forEach((game, i) => {
        // Se temos múltiplas quadras, marcamos A, B... mesmo que só um jogo ocorra naquele slot
        // Mas o distribuidores deve garantir que não passe de numberOfCourts
        game.court = `Quadra ${String.fromCharCode(65 + i)}`
      })
    }
  }
  
  return result
}
