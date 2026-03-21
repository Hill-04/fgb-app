import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatChampionshipStatus(status: string): string {
  const map: Record<string, string> = {
    'DRAFT': 'Rascunho',
    'REGISTRATION_OPEN': 'Inscrições Abertas',
    'REGISTRATION_CLOSED': 'Inscrições Encerradas',
    'ONGOING': 'Em Andamento',
    'FINISHED': 'Encerrado',
    'ARCHIVED': 'Arquivado'
  }
  return map[status] || status
}
