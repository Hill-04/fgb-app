export function pluralizeJogos(count: number): string {
  return count === 1 ? '1 jogo' : `${count} jogos`
}

export function pluralizeDias(count: number): string {
  return count === 1 ? '1 dia' : `${count} dias`
}

export function pluralizeCategorias(count: number): string {
  return count === 1 ? '1 categoria' : `${count} categorias`
}
