interface GameSlot {
  id?: string
  dateTime: Date
  court?: string
}

export function assignCourts(slots: GameSlot[]): GameSlot[] {
  const result = [...slots]
  const slotsByTime = new Map<number, GameSlot[]>()
  
  for (const slot of result) {
    const time = slot.dateTime.getTime()
    if (!slotsByTime.has(time)) slotsByTime.set(time, [])
    slotsByTime.get(time)!.push(slot)
  }
  
  for (const [time, games] of slotsByTime.entries()) {
    if (games.length === 1) {
      games[0].court = 'Quadra Única'
    } else {
      games.forEach((game, i) => {
        game.court = `Quadra ${String.fromCharCode(65 + i)}` // A, B, C...
      })
    }
  }
  
  return result
}
