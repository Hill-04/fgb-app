import { z } from 'zod'

export const createTeamSchema = z.object({
  name: z.string().min(3, 'Nome da equipe deve ter pelo menos 3 caracteres'),
  sex: z.enum(['masculino', 'feminino', 'misto']),
  city: z.string().min(2, 'Informe a cidade'),
  state: z.string().min(2, 'Informe o estado').default('RS'),
  phone: z.string().min(8, 'Informe um telefone de contato'),
  responsible: z.string().min(3, 'Informe o responsável principal'),
  logoUrl: z.string().url('URL inválida').optional().nullable(),
  hasGym: z.boolean().optional().default(false),
  gym: z.object({
    name: z.string().min(3, 'Informe o nome do ginásio'),
    address: z.string().min(5, 'Informe o endereço completo'),
    city: z.string().min(2, 'Informe a cidade do ginásio'),
    capacity: z.number().int().positive().or(z.string().transform(Number)),
    availability: z.string(),
    canHost: z.boolean().optional().default(true),
  }).optional().nullable(),
})

export const joinTeamSchema = z.object({
  teamId: z.string().uuid('ID inválido'),
  role: z.string().optional().default('STAFF_OTHER'),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type JoinTeamInput = z.infer<typeof joinTeamSchema>
